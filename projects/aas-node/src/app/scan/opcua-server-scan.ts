/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AttributeIds, BrowseDescriptionLike, QualifiedName, ReferenceDescription } from 'node-opcua';
import { AASDocument, noop, PagedResult } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { OpcuaDataTypeDictionary } from '../client/opcua/opcua-data-type-dictionary.js';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { AASServerScan } from './aas-server-scan.js';

export class OpcuaServerScan extends AASServerScan {
    private readonly logger: Logger;
    private readonly client: OpcuaClient;
    private readonly map = new Map<string, AASDocument>();

    public constructor(logger: Logger, client: OpcuaClient) {
        super();

        this.logger = logger;
        this.client = client;
    }

    protected override open(): Promise<void> {
        this.map.clear();
        return this.client.open();
    }

    protected override close(): Promise<void> {
        this.map.clear();
        return this.client.close();
    }

    protected override createDocument(nodeId: string): Promise<AASDocument> {
        const document = this.map.get(nodeId);
        return document ? Promise.resolve(document) : Promise.reject(new Error(`${nodeId} not found.`));
    }

    protected override async nextEndpointPage(cursor: string | undefined): Promise<PagedResult<string>> {
        noop(cursor);
        const nodeIds: string[] = [];
        const dataTypes = new OpcuaDataTypeDictionary();
        await dataTypes.initializeAsync(this.client.getSession());
        for (const description of await this.browseAsync('ObjectsFolder')) {
            const nodeId = description.nodeId.toString();
            try {
                const document = await this.client.createDocument(nodeId);
                nodeIds.push(nodeId);
                this.map.set(document.address, document);
            } catch (error) {
                this.emit('error', error, this.client, nodeId);
            }
        }

        return { result: nodeIds, paging_metadata: {} };
    }

    private async browseAsync(
        nodeToBrowse: BrowseDescriptionLike,
        descriptions: ReferenceDescription[] = [],
    ): Promise<ReferenceDescription[]> {
        const session = this.client.getSession();
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
        const node = await this.client.getSession().read({
            nodeId: obj.typeDefinition,
            attributeId: AttributeIds.BrowseName,
        });

        return node.value.value as QualifiedName;
    }
}
