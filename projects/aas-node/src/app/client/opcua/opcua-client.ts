/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { Readable } from 'stream';
import { OpaqueStructure } from 'node-opcua-extension-object';
import { AASDocument, AASEndpoint, LiveRequest, PagedResult, aas, noop } from 'aas-core';
import {
    AttributeIds,
    BrowseDescriptionLike,
    ClientSession,
    ConnectionStrategyOptions,
    DataType,
    DataValue,
    MessageSecurityMode,
    NodeId,
    OPCUAClient,
    OPCUAClientOptions,
    QualifiedName,
    ReferenceDescription,
    SecurityPolicy,
    StatusCodes,
    VariantArrayType,
    VariantOptions,
    coerceNodeId,
} from 'node-opcua';

import { Logger } from 'aas-package';
import { OpcuaSubscription } from '../../live/opcua/opcua-subscription.js';
import { SocketClient } from '../../live/socket-client.js';
import { SocketSubscription } from '../../live/socket-subscription.js';
import { EndpointClient } from '../endpoint-client.js';
import { OPCUAComponent, OPCUAProperty, readDataTypeAsync } from './opcua.js';
import { NodeCrawler, NodeCrawlerClientSession } from 'node-opcua-client-crawler';
import { decodeOpaqueStructure } from './opaque-structure-decoder.js';
import { OpcuaReader } from './opcua-reader.js';
import { OpcuaDataTypeDictionary } from './opcua-data-type-dictionary.js';
import { ClientFile, OpenFileMode } from './client-file.js';

export class OpcuaClient extends EndpointClient {
    private readonly options: OPCUAClientOptions;
    private dataTypes = new OpcuaDataTypeDictionary();
    private client: OPCUAClient | null = null;
    private session: ClientSession | null = null;
    private reentry = 0;

    public constructor(logger: Logger, endpoint: AASEndpoint, options?: OPCUAClientOptions) {
        super(logger, endpoint);

        if (options) {
            this.options = this.resolveOpcuaClientOptions(options);
        } else {
            this.options = {
                applicationName: 'aas-node',
                connectionStrategy: {
                    initialDelay: 1000,
                    maxRetry: 1,
                },
                securityMode: MessageSecurityMode.None,
                securityPolicy: SecurityPolicy.None,
                endpointMustExist: false,
            };
        }
    }

    public override readonly readOnly = true;

    public override readonly providesLiveData = true;

    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    /**
     * Gets the current client session.
     **/
    public getSession(): ClientSession {
        if (this.reentry <= 0 || this.session == null) {
            throw new Error(`No session to ${this.endpoint} established.`);
        }

        return this.session;
    }

    public override async test(): Promise<void> {
        if (this.reentry === 0) {
            try {
                await this.open();
            } finally {
                await this.close();
            }
        }
    }

    public override async open(): Promise<void> {
        if (this.reentry === 0) {
            this.client = OPCUAClient.create(this.options as OPCUAClientOptions);
            await this.client.connect(this.endpoint.url);
            this.session = await this.client.createSession();
        }

        ++this.reentry;
    }

    public override async close(): Promise<void> {
        if (this.reentry > 0) {
            --this.reentry;
            if (this.reentry === 0) {
                if (this.client) {
                    if (this.session) {
                        await this.client.closeSession(this.session, true);
                        this.session = null;
                    }

                    await this.client.disconnect();
                    this.client = null;
                }
            }
        }
    }

    public override async hasDocument(nodeId: string): Promise<boolean> {
        try {
            const component = await this.crawlAsync(nodeId);
            return !!component;
        } catch {
            return false;
        }
    }

    public override async getDocuments(): Promise<PagedResult<AASDocument>> {
        const documents: AASDocument[] = [];
        const dataTypes = new OpcuaDataTypeDictionary();
        await dataTypes.initializeAsync(this.getSession());
        for (const description of await this.browseAsync('ObjectsFolder')) {
            const nodeId = description.nodeId.toString();
            try {
                const document = await this.getDocument(nodeId);
                documents.push(document);
            } catch (error) {
                noop(error);
            }
        }

        return { result: documents, paging_metadata: {} };
    }

    public override async getSubmodels(): Promise<PagedResult<aas.Submodel>> {
        const submodels: aas.Submodel[] = [];
        for (const description of await this.browseAsync('ObjectsFolder')) {
            const nodeId = description.nodeId.toString();
            try {
                const env = await this.getEnvironment(nodeId);
                if (!env.submodels) {
                    continue;
                }

                submodels.push(...env.submodels);
            } catch (error) {
                noop(error);
            }
        }

        return { result: submodels, paging_metadata: {} };
    }

    public override createSubscription(client: SocketClient, message: LiveRequest): SocketSubscription {
        return new OpcuaSubscription(this.logger, client, this, message.nodes);
    }

    public override getThumbnail(nodeId: string): Promise<NodeJS.ReadableStream | undefined> {
        noop(nodeId);
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async getEnvironment(nodeId: string): Promise<aas.Environment> {
        const component = await this.crawlAsync(nodeId);
        const reader = new OpcuaReader(component, this.dataTypes);
        return await reader.readEnvironment();
    }

    public override setEnvironment(nodeId: string, env: aas.Environment): Promise<void> {
        noop(nodeId, env);
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async getFile(nodeId: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        noop(nodeId);
        const session = this.getSession();
        if (!file.nodeId) {
            throw new Error('Invalid operation.');
        }

        const clientFile = new ClientFile(session, file.nodeId);
        await clientFile.open(OpenFileMode.Read);
        try {
            const buffer = await clientFile.read(0);
            return Readable.from(buffer);
        } finally {
            await clientFile.close();
        }
    }

    public override async determineAddress(aasxFile: string): Promise<string | undefined> {
        noop(aasxFile);
        return await Promise.resolve(undefined);
    }

    public override getPackage(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override insertPackage(): Promise<void> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override deletePackage(): Promise<void> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async invoke(operation: aas.Operation): Promise<aas.Operation> {
        const inputArguments: Array<VariantOptions> = [];
        if (operation.inputVariables) {
            for (const inputVariable of operation.inputVariables) {
                inputArguments.push(await this.toVariantAsync(inputVariable.value));
            }
        }

        const result = await this.session!.call({
            inputArguments: inputArguments,
            methodId: coerceNodeId(operation.methodId),
            objectId: coerceNodeId(operation.objectId),
        });

        if (result.statusCode.value !== StatusCodes.Good.value) {
            throw new Error(`Operation call returns with status code ${result.statusCode.toString()},`);
        }

        if (result.outputArguments && operation.outputVariables) {
            for (let index = 0; index < operation.outputVariables.length; ++index) {
                operation.outputVariables[index].value = result.outputArguments[index].value;
            }
        }

        return operation;
    }

    public override getBlobValue(): Promise<string | undefined> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override getAllAssetAdministrationShellIdsByAssetLink(): Promise<PagedResult<string>> {
        return Promise.reject(new Error('Not implemented.'));
    }

    private async browseAsync(
        nodeToBrowse: BrowseDescriptionLike,
        descriptions: ReferenceDescription[] = [],
    ): Promise<ReferenceDescription[]> {
        const session = this.getSession();
        const result = await session.browse(nodeToBrowse);
        if (result.references) {
            for (const obj of result.references) {
                if (await this.isAASTypeAsync(obj)) {
                    descriptions.push(obj);
                } else if (await this.isFolderAsync(obj)) {
                    await this.browseAsync(obj.nodeId.toString(), descriptions);
                }
            }
        }

        return descriptions;
    }

    private async isFolderAsync(obj: ReferenceDescription): Promise<boolean> {
        const type = (await this.readQualifiedName(obj)).name;
        return type === 'FolderType' || type === 'AASEnvironmentType' || obj.browseName.name === 'AASEnvironment';
    }

    private async isAASTypeAsync(obj: ReferenceDescription): Promise<boolean> {
        return (await this.readQualifiedName(obj))?.name === 'AASAssetAdministrationShellType';
    }

    private async readQualifiedName(obj: ReferenceDescription): Promise<QualifiedName> {
        const node = await this.getSession().read({
            nodeId: obj.typeDefinition,
            attributeId: AttributeIds.BrowseName,
        });

        return node.value.value as QualifiedName;
    }

    private resolveOpcuaClientOptions(options: OPCUAClientOptions): OPCUAClientOptions {
        if (options) {
            options = {
                applicationName: options.applicationName,
                connectionStrategy: this.resolveConnectionStrategy(options.connectionStrategy),
                securityMode: this.resolveMode(options.securityMode),
                securityPolicy: this.resolvePolicy(options.securityPolicy),
                endpointMustExist: options.endpointMustExist,
            } as OPCUAClientOptions;
        }

        return options;
    }

    private resolveConnectionStrategy(value?: ConnectionStrategyOptions): ConnectionStrategyOptions | undefined {
        if (value) {
            value = {
                initialDelay: value.initialDelay,
                maxRetry: value.maxRetry,
            };
        }

        return value;
    }

    private resolveMode(value?: string | MessageSecurityMode): MessageSecurityMode {
        if (value) {
            return typeof value === 'string' ? MessageSecurityMode[value as keyof typeof MessageSecurityMode] : value;
        }

        return MessageSecurityMode.None;
    }

    private resolvePolicy(value?: string | SecurityPolicy): SecurityPolicy {
        if (value) {
            return typeof value === 'string' ? SecurityPolicy[value as keyof typeof SecurityPolicy] : value;
        }

        return SecurityPolicy.None;
    }

    private async toVariantAsync(value: aas.SubmodelElement): Promise<VariantOptions> {
        if (value.modelType === 'Property') {
            const property = value as aas.Property;
            switch (property.valueType) {
                case 'xs:string': {
                    let buffer: Buffer;
                    if (typeof property.value === 'string') {
                        buffer = await fs.promises.readFile(property.value);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } else if (<any>property.value instanceof Buffer) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        buffer = (<any>property.value) as Buffer;
                    } else {
                        throw new Error('Not supported File representation.');
                    }

                    return this.createVariantOptions(VariantArrayType.Scalar, DataType.ByteString, buffer);
                }
                default:
                    return this.createVariantOptions(VariantArrayType.Scalar, property.valueType, property.value);
            }
        } else {
            throw new Error('Not implemented.');
        }
    }

    private createVariantOptions(
        arrayType: VariantArrayType,
        dataType: DataType | aas.DataTypeDefXsd | undefined,
        value: unknown,
    ): VariantOptions {
        if (typeof dataType === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dataType = (<any>DataType)[dataType];
        }

        if (typeof arrayType === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            arrayType = (<any>VariantArrayType)[arrayType];
        }

        return {
            arrayType: arrayType,
            dataType: dataType,
            value: value,
            dimensions: Array.isArray(value) ? [1] : null,
        };
    }

    private async crawlAsync(nodeId: string): Promise<OPCUAComponent> {
        const crawler = new NodeCrawler(this.getSession() as unknown as NodeCrawlerClientSession);
        const component = (await crawler.read(NodeId.resolveNodeId(nodeId))) as OPCUAComponent;
        await this.resolveAsync(component);
        return component;
    }

    private async resolveAsync(component: OPCUAComponent, visited: Set<string> = new Set<string>()): Promise<void> {
        const nodeId = component.nodeId.toString();
        if (!visited.has(nodeId)) {
            visited.add(nodeId);
            if (component.hasProperty) {
                const session = this.getSession();
                for (const property of component.hasProperty) {
                    if (property.dataValue.value?.dataType === 'ExtensionObject') {
                        const dataValue = await this.readDataValueAsync(session, property);
                        const opaqueStructure = this.readOpaqueStructure(dataValue);
                        if (opaqueStructure) {
                            const dataType = await readDataTypeAsync(session, property.dataType);
                            property.dataValue = decodeOpaqueStructure(opaqueStructure[0], dataType);
                        }
                    }
                }
            }

            if (component.hasComponent) {
                for (const child of component.hasComponent) {
                    await this.resolveAsync(child, visited);
                }
            }

            if (component.hasAddIn) {
                for (const addIn of component.hasAddIn) {
                    await this.resolveAsync(addIn, visited);
                }
            }
        }
    }

    private async readDataValueAsync(session: ClientSession, property: OPCUAProperty): Promise<DataValue> {
        return await session.read({
            nodeId: property.nodeId,
            attributeId: AttributeIds.Value,
        });
    }

    private readOpaqueStructure(dataValue: DataValue): OpaqueStructure[] | undefined {
        if (dataValue.value?.dataType === DataType.ExtensionObject) {
            const value = dataValue.value;
            if (value.arrayType === VariantArrayType.Array) {
                if (Array.isArray(value.value) && value.value.length > 0 && value.value[0] instanceof OpaqueStructure) {
                    return value.value as OpaqueStructure[];
                }
            }
        }

        return undefined;
    }

    private getIdentifier(component: OPCUAComponent, nodeId: string): string {
        return this.readIdentifier(component) ?? nodeId;
    }

    private readIdentifier(component: OPCUAComponent): string | undefined {
        const identification = this.selectComponent(component, 'Identification');
        return identification ? this.getPropertyValue(identification, 'Id', '') : undefined;
    }

    private selectComponent(parent: OPCUAComponent, browseName: string): OPCUAComponent | undefined {
        if (parent.hasComponent) {
            for (const component of parent.hasComponent) {
                if (component.browseName === browseName) {
                    return component;
                }
            }
        }

        return undefined;
    }

    private getPropertyValue<T>(parent: OPCUAComponent, browseName: string, fallback: T): T {
        let value: T = fallback;
        if (parent.hasProperty) {
            for (const property of parent.hasProperty) {
                if (property.browseName === browseName) {
                    value = property.dataValue.value?.value as T;
                    break;
                }
            }
        }

        return value;
    }
}
