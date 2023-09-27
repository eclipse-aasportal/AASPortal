/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, diffAsync, aas } from 'common';
import { AASPackage } from '../aas-package.js';
import { AASResource } from '../aas-resource.js';
import { Logger } from '../../logging/logger.js';
import { AasxServer } from './aasx-server.js';

export class AasxServerPackage extends AASPackage {
    private readonly source: AasxServer;
    private readonly idShort: string;

    /**
     * Creates a new AAS-Registry package.
     * @param logger The logger service.
     * @param source The handle.
     * @param idShort The name of the AAS.
     */
    constructor(logger: Logger, source: AASResource, idShort: string) {
        super(logger);

        this.source = source as AasxServer;
        this.idShort = idShort;
    }

    public getThumbnailAsync(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public openReadStreamAsync(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file) {
            throw new Error('Invalid operation.');
        }

        return this.source.openFileAsync(env.assetAdministrationShells[0], file);
    }

    public async createDocumentAsync(): Promise<AASDocument> {
        const environment = await this.source.readEnvironmentAsync(this.idShort);
        const document: AASDocument = {
            id: environment.assetAdministrationShells[0].id,
            container: this.source.url.href,
            endpoint: { type: 'http', address: this.idShort },
            idShort: environment.assetAdministrationShells[0].idShort,
            timeStamp: Date.now(),
            readonly: this.source.readOnly,
            modified: false,
            onlineReady: true,
            content: environment
        };

        return document;
    }

    public async commitDocumentAsync(target: AASDocument, content: aas.Environment): Promise<string[]> {
        let messages: string[] | undefined;
        if (target.content && content) {
            const diffs = await diffAsync(content, target.content);
            if (diffs.length > 0) {
                messages = await this.source.commitAsync(content, target.content, diffs);
            }
        }

        return messages ?? [];
    }
}