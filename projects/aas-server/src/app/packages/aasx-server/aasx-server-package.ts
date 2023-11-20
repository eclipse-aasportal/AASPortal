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
import { ImageProcessing } from '../../image-processing.js';

export class AasxServerPackage extends AASPackage {
    private readonly server: AasxServer;
    private readonly idShort: string;

    /**
     * Creates a new AAS-Registry package.
     * @param logger The logger service.
     * @param resource The handle.
     * @param idShort The name of the AAS.
     */
    constructor(logger: Logger, resource: AASResource, idShort: string) {
        super(logger);

        this.server = resource as AasxServer;
        this.idShort = idShort;
    }

    public getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream> {
        return this.server.getThumbnailAsync(id);
    }

    public openReadStreamAsync(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file) {
            throw new Error('Invalid operation.');
        }

        return this.server.openFileAsync(env.assetAdministrationShells[0], file);
    }

    public async createDocumentAsync(): Promise<AASDocument> {
        const environment = await this.server.readEnvironmentAsync(this.idShort);

        const document: AASDocument = {
            id: environment.assetAdministrationShells[0].id,
            endpoint: this.server.name,
            address: this.idShort,
            idShort: environment.assetAdministrationShells[0].idShort,
            readonly: this.server.readOnly,
            onlineReady: true,
            content: null
        };

        const thumbnail = await this.createThumbnail(document.id);
        if (thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    public override async readEnvironmentAsync(): Promise<aas.Environment> {
        return await this.server.readEnvironmentAsync(this.idShort);
    }

    public async commitDocumentAsync(target: AASDocument, content: aas.Environment): Promise<string[]> {
        let messages: string[] | undefined;
        if (target.content && content) {
            const diffs = await diffAsync(content, target.content);
            if (diffs.length > 0) {
                messages = await this.server.commitAsync(content, target.content, diffs);
            }
        }

        return messages ?? [];
    }

    private async createThumbnail(id: string): Promise<string | undefined> {
        try {
            const input = await this.server.getThumbnailAsync(id);
            const output = await ImageProcessing.resizeAsync(input, 40, 40);
            return await this.streamToBase64(output);
        } catch {
            return undefined;
        }
    }
}