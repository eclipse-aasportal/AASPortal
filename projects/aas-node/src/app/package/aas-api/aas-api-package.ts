/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, diffAsync, aas } from 'aas-core';
import { AASPackage } from '../aas-package.js';
import { AASClient } from '../aas-client.js';
import { Logger } from '../../logging/logger.js';
import { AASApiClient } from './aas-api-client.js';
import { ImageProcessing } from '../../image-processing.js';

export class AASApiPackage extends AASPackage {
    private readonly client: AASApiClient;
    private readonly id: string;
    private readonly idShort: string;

    /**
     * Creates a new AAS-Registry package.
     * @param logger The logger service.
     * @param client The client.
     * @param id The identifier of the AAS.
     */
    public constructor(logger: Logger, client: AASClient, id: string, idShort: string) {
        super(logger);

        this.client = client as AASApiClient;
        this.id = id;
        this.idShort = idShort;
    }

    public getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.client.getThumbnail(id);
    }

    public openReadStream(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file) {
            throw new Error('Invalid operation.');
        }

        return this.client.openFile(env.assetAdministrationShells[0], file);
    }

    public async createDocumentAsync(): Promise<AASDocument> {
        const environment = await this.client.readEnvironment({ id: this.id, idShort: this.idShort });
        const document: AASDocument = {
            id: environment.assetAdministrationShells[0].id,
            endpoint: this.client.endpoint.name,
            address: this.id,
            idShort: environment.assetAdministrationShells[0].idShort,
            assetId: environment.assetAdministrationShells[0].assetInformation.globalAssetId,
            readonly: this.client.readOnly,
            onlineReady: true,
            content: environment,
            timestamp: Date.now(),
            crc32: this.computeCrc32(environment),
        };

        const thumbnail = await this.createThumbnail(document.id);
        if (thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    public override getEnvironment(): Promise<aas.Environment> {
        return this.client.readEnvironment({ id: this.id, idShort: this.idShort });
    }

    public async setEnvironmentAsync(content: aas.Environment, reference?: aas.Environment): Promise<string[]> {
        let messages: string[] | undefined;
        if (reference && content) {
            const diffs = await diffAsync(content, reference);
            if (diffs.length > 0) {
                messages = await this.client.commit(content, reference, diffs);
            }
        }

        return messages ?? [];
    }

    private async createThumbnail(id: string): Promise<string | undefined> {
        try {
            const input = await this.client.getThumbnail(id);
            const output = await ImageProcessing.resizeAsync(input, 40, 40);
            return await this.streamToBase64(output);
        } catch {
            return undefined;
        }
    }
}
