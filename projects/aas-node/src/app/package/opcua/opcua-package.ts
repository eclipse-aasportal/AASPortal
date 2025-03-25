/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AttributeIds, ClientSession, DataType, DataValue, NodeId, VariantArrayType } from 'node-opcua';
import { NodeCrawler, NodeCrawlerClientSession } from 'node-opcua-client-crawler';
import { OpaqueStructure } from 'node-opcua-extension-object';
import { Readable } from 'stream';
import { OpcuaClient } from './opcua-client.js';
import { OPCUAComponent, OPCUAProperty, readDataTypeAsync } from './opcua.js';
import { AASPackage } from '../aas-package.js';
import { Logger } from '../../logging/logger.js';
import { decodeOpaqueStructure } from './opaque-structure-decoder.js';
import { OpcuaDataTypeDictionary } from './opcua-data-type-dictionary.js';
import { ClientFile, OpenFileMode } from './client-file.js';
import { AASDocument, aas } from 'aas-core';
import { OpcuaReader } from './opcua-reader.js';

export class OpcuaPackage extends AASPackage {
    private readonly server: OpcuaClient;
    private readonly nodeId: string;
    private readonly dataTypes: OpcuaDataTypeDictionary;

    public constructor(logger: Logger, server: OpcuaClient, nodeId: string, dataTypes?: OpcuaDataTypeDictionary) {
        super(logger);

        this.server = server;
        this.nodeId = nodeId;
        this.dataTypes = dataTypes ?? new OpcuaDataTypeDictionary();
    }

    public async createDocumentAsync(): Promise<AASDocument> {
        const component = await this.crawlAsync();
        if (component.typeDefinition !== 'AASAssetAdministrationShellType') {
            throw new Error(`${this.nodeId}: ${component.typeDefinition} is an unexpected type definition.`);
        }

        const content = await new OpcuaReader(this.logger, component, this.dataTypes).readEnvironment();
        const document: AASDocument = {
            id: this.getIdentifier(component),
            endpoint: this.server.endpoint.name,
            address: this.nodeId,
            idShort: component.browseName,
            assetId: 'ToDo...',
            readonly: this.server.readOnly,
            onlineReady: this.server.onlineReady,
            content,
            timestamp: Date.now(),
            crc32: this.computeCrc32(content),
        };

        return document;
    }

    public override async getEnvironment(): Promise<aas.Environment> {
        const component = await this.crawlAsync();
        const reader = new OpcuaReader(this.logger, component, this.dataTypes);
        return await reader.readEnvironment();
    }

    public override setEnvironmentAsync(): Promise<string[]> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override getThumbnail(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public async openReadStream(_: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        const session = this.server.getSession();
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

    private async crawlAsync(): Promise<OPCUAComponent> {
        const crawler = new NodeCrawler(this.server.getSession() as unknown as NodeCrawlerClientSession);
        const component = (await crawler.read(NodeId.resolveNodeId(this.nodeId))) as OPCUAComponent;
        await this.resolveAsync(component);
        return component;
    }

    private async resolveAsync(component: OPCUAComponent, visited: Set<string> = new Set<string>()): Promise<void> {
        const nodeId = component.nodeId.toString();
        if (!visited.has(nodeId)) {
            visited.add(nodeId);
            if (component.hasProperty) {
                const session = this.server.getSession();
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

    private getIdentifier(component: OPCUAComponent): string {
        let id = this.readIdentifier(component);
        if (!id) {
            id = this.nodeId;
            this.logger.debug(
                `Unable to read AAS identifier for '${component.browseName}' in '${this.server.endpoint}'.'`,
            );
        }

        return id;
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
