/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, noop, PagedResult } from 'aas-core';
import { Logger } from '../../logging/logger.js';
import { JsonReaderV2 } from '../json-reader-v2.js';
import { ApiClient, AASLabel } from './api-client.js';
import { JsonWriterV2 } from '../json-writer-v2.js';
import * as aasV2 from '../../types/aas-v2.js';
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

    public async getShells(cursor?: string): Promise<PagedResult<AASLabel>> {
        noop(cursor);
        const result = await this.http.get<AASList>(this.resolve('/server/listaas'));
        return {
            result: result.aaslist.map(entry => {
                const items = entry.split(' : ');
                return { id: items[2].trim().split(' ')[1].trim(), idShort: items[1].trim() };
            }),
            paging_metadata: {},
        };
    }

    public override getThumbnail(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async readEnvironment(id: string, idShort: string): Promise<aas.Environment> {
        const sourceEnv = await this.http.get<aasV2.AssetAdministrationShellEnvironment>(
            this.resolve(`/aas/${idShort}/aasenv`),
        );

        return new JsonReaderV2(sourceEnv).readEnvironment();
    }

    public override async writeEnvironment(id: string, env: aas.Environment): Promise<void> {
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

    public async openFile(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const url = await this.getFileUrlAsync(shell.idShort, file.value!);
        return await this.http.getResponse(url, this.endpoint.headers);
    }

    public override getPackage(): Promise<NodeJS.ReadableStream> {
        throw new Error('Not implemented.');
    }

    public override postPackage(): Promise<string> {
        throw new Error('Not implemented.');
    }

    public override deletePackage(): Promise<string> {
        throw new Error('Not implemented.');
    }

    public invoke(): Promise<aas.Operation> {
        throw new Error('Not implemented.');
    }

    public getBlobValue(): Promise<string | undefined> {
        throw new Error('Not implemented.');
    }

    private async getFileUrlAsync(idShort: string, address: string): Promise<URL> {
        const listAAS = await this.http.get<AASList>(this.resolve('/server/listaas'));
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

    private putSubmodel(id: string, submodel: aasV2.Submodel): Promise<string> {
        return this.http.put(this.resolve('/aas/' + id + '/submodels/'), submodel);
    }
}
