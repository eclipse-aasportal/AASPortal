/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, AASEndpoint, noop, PagedResult } from 'aas-core';
import { aasV2, JsonReaderV2, JsonWriterV2 } from 'aas-package';
import { Logger } from '../../logging/logger.js';
import { ApiClient } from './api-client.js';
import { HttpClient } from '../../http-client.js';

interface AASList {
    aaslist: string[];
}

export class ApiClientV0 extends ApiClient {
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, http, endpoint);
    }

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getDocuments(cursor?: string): Promise<PagedResult<AASDocument>> {
        noop(cursor);
        const result = await this.http.getJson<AASList>(this.resolve('/server/listaas'));
        const idShorts = result.aaslist.map(entry => {
            const items = entry.split(' : ');
            return items[1].trim();
        });

        const envs = await Promise.all(
            idShorts.map(idShort =>
                this.http.getJson<aasV2.AssetAdministrationShellEnvironment>(this.resolve(`/aas/${idShort}/aasenv`)),
            ),
        );

        return {
            result: envs.map(env => this.toDocument(env)),
            paging_metadata: {},
        };
    }

    public override getThumbnail(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async getEnvironment(idShort: string): Promise<aas.Environment> {
        const sourceEnv = await this.http.getJson<aasV2.AssetAdministrationShellEnvironment>(
            this.resolve(`/aas/${idShort}/aasenv`),
        );

        return new JsonReaderV2(sourceEnv, true).readEnvironment();
    }

    public override async setEnvironment(id: string, env: aas.Environment): Promise<void> {
        if (env.assetAdministrationShells.length > 0) {
            throw new Error('Not implemented.');
        }

        if (env.submodels) {
            await this.putSubmodels(id, env.submodels);
        }

        if (env.conceptDescriptions) {
            throw new Error('Not implemented.');
        }
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = nodeId.substring(index + 1);
        return this.resolve(`/aas/${shell.idShort}/submodels/${smId}/elements/${idShortPath}/value`).href;
    }

    public override async getFile(idShort: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        const url = await this.getFileUrlAsync(idShort, file.value!);
        return await this.http.getReadable(url, this.endpoint.headers);
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

    public invoke(): Promise<aas.Operation> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public getBlobValue(): Promise<string | undefined> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override getAllAssetAdministrationShellIdsByAssetLink(): Promise<string[]> {
        return Promise.reject(new Error('Not implemented.'));
    }

    private toDocument(env: aasV2.AssetAdministrationShellEnvironment): AASDocument {
        const shell = env.assetAdministrationShells[0];
        return {
            address: shell.idShort,
            assetId: shell.asset.keys[0].value,
            content: null,
            crc32: 0,
            endpoint: this.endpoint.name,
            id: shell.identification.id,
            idShort: shell.idShort,
            readonly: true,
            timestamp: Date.now(),
        };
    }

    private async getFileUrlAsync(idShort: string, address: string): Promise<URL> {
        const listAAS = await this.http.getJson<AASList>(this.resolve('/server/listaas'));
        for (const aas of listAAS.aaslist) {
            const items = aas.split(':');
            if (items[1].trim() === idShort) {
                const index = items[0].trim();
                return this.resolve('/server/getfile/' + index + address);
            }
        }

        throw new Error(`${idShort}: Unable to resolve image address '${address}'.`);
    }

    private async putSubmodels(id: string, submodels: aas.Submodel[]): Promise<void> {
        for (const submodel of submodels) {
            await this.putSubmodel(id, new JsonWriterV2().convert(submodel));
        }
    }

    private async putSubmodel(id: string, submodel: aasV2.Submodel): Promise<void> {
        await this.http.put(this.resolve('/aas/' + id + '/submodels/'), submodel);
    }
}