/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AttributeIds, BrowseDescriptionLike, QualifiedName, ReferenceDescription } from 'node-opcua';
import { AASDocument, noop } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { OpcuaDataTypeDictionary } from '../package/opcua/opcua-data-type-dictionary.js';
import { OpcuaClient } from '../package/opcua/opcua-client.js';
import { OpcuaPackage } from '../package/opcua/opcua-package.js';
import { AASServerScan } from './aas-server-scan.js';
import { PagedResult } from '../types/paged-result.js';
import { AASLabel } from '../package/aas-api/aas-api-client.js';

export class OpcuaServerScan extends AASServerScan {
    private readonly logger: Logger;
    private readonly server: OpcuaClient;
    private readonly map = new Map<string, AASDocument>();

    public constructor(logger: Logger, server: OpcuaClient) {
        super();

        this.logger = logger;
        this.server = server;
    }

    protected override open(): Promise<void> {
        this.map.clear();
        return this.server.open();
    }

    protected override close(): Promise<void> {
        this.map.clear();
        return this.server.close();
    }

    protected override createDocument(id: AASLabel): Promise<AASDocument> {
        const document = this.map.get(id.id);
        return document ? Promise.resolve(document) : Promise.reject(new Error(`${id} not found.`));
    }

    protected override async nextEndpointPage(cursor: string | undefined): Promise<PagedResult<AASLabel>> {
        noop(cursor);
        const ids: AASLabel[] = [];
        const dataTypes = new OpcuaDataTypeDictionary();
        await dataTypes.initializeAsync(this.server.getSession());
        for (const description of await this.browseAsync('ObjectsFolder')) {
            const nodeId = description.nodeId.toString();
            try {
                const opcuaPackage = new OpcuaPackage(this.logger, this.server, nodeId, dataTypes);
                const document = await opcuaPackage.createDocumentAsync();
                ids.push({ id: document.id, idShort: document.idShort });
                this.map.set(document.id, document);
            } catch (error) {
                this.emit('error', error, this.server, nodeId);
            }
        }

        return { result: ids, paging_metadata: {} };
    }

    private async browseAsync(
        nodeToBrowse: BrowseDescriptionLike,
        descriptions: ReferenceDescription[] = [],
    ): Promise<ReferenceDescription[]> {
        const session = this.server.getSession();
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
        return type === 'FolderType' || type === 'AASEnvironmentType';
    }

    private async isAASTypeAsync(obj: ReferenceDescription): Promise<boolean> {
        return (await this.readQualifiedName(obj))?.name === 'AASAssetAdministrationShellType';
    }

    private async readQualifiedName(obj: ReferenceDescription): Promise<QualifiedName> {
        const node = await this.server.getSession().read({
            nodeId: obj.typeDefinition,
            attributeId: AttributeIds.BrowseName,
        });

        return node.value.value as QualifiedName;
    }
}
