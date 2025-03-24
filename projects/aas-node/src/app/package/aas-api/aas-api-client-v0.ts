/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, DifferenceItem, noop, selectSubmodel } from 'aas-core';
import { Logger } from '../../logging/logger.js';
import { JsonReaderV2 } from '../json-reader-v2.js';
import { AASApiClient, AASLabel } from './aas-api-client.js';
import { JsonWriterV2 } from '../json-writer-v2.js';
import * as aasV2 from '../../types/aas-v2.js';
import { HttpClient } from '../../http-client.js';
import { PagedResult } from '../../types/paged-result.js';

interface AASList {
    aaslist: string[];
}

export class AASApiClientV0 extends AASApiClient {
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

    public override async readEnvironment(id: AASLabel): Promise<aas.Environment> {
        const sourceEnv = await this.http.get<aasV2.AssetAdministrationShellEnvironment>(
            this.resolve(`/aas/${id.idShort}/aasenv`),
        );

        return new JsonReaderV2(sourceEnv).readEnvironment();
    }

    public override getThumbnail(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async commit(
        source: aas.Environment,
        destination: aas.Environment,
        diffs: DifferenceItem[],
    ): Promise<string[]> {
        const messages: string[] = [];
        const updateSubmodels = new Set<aas.Submodel>();
        const deleteSubmodels = new Set<aas.Submodel>();
        for (const diff of diffs) {
            if (diff.type === 'changed' || diff.type === 'inserted') {
                if (diff.sourceElement) {
                    const submodel = selectSubmodel(source, diff.sourceElement);
                    if (submodel && !updateSubmodels.has(submodel)) {
                        updateSubmodels.add(submodel);
                    }
                }
            } else if (diff.type === 'deleted') {
                if (diff.destinationElement) {
                    if (diff.destinationElement.modelType === 'Submodel') {
                        const submodel = diff.destinationElement as aas.Submodel;
                        if (!deleteSubmodels.has(submodel)) {
                            deleteSubmodels.add(submodel);
                            if (updateSubmodels.has(submodel)) {
                                updateSubmodels.delete(submodel);
                            }
                        }
                    } else {
                        const submodel = selectSubmodel(destination, diff.destinationElement);
                        if (submodel && !updateSubmodels.has(submodel) && !deleteSubmodels.has(submodel)) {
                            updateSubmodels.add(submodel);
                        }
                    }
                }
            }
        }

        if (updateSubmodels.size > 0) {
            messages.push(...(await this.putSubmodelsAsync(destination, updateSubmodels.values())));
        }

        if (deleteSubmodels.size > 0) {
            messages.push(...(await this.deleteSubmodelsAsync(destination, deleteSubmodels.values())));
        }

        return messages;
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const items = nodeId.split('.')[1].split('/');
        const path = items.slice(1).join('/');
        return this.resolve(`/aas/${shell.idShort}/submodels/${items[0]}/elements/${path}/value`).href;
    }

    public async openFile(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const url = await this.getFileUrlAsync(shell.idShort, file.value!);
        return await this.http.getResponse(url, this.endpoint.headers);
    }

    public override getPackageAsync(): Promise<NodeJS.ReadableStream> {
        throw new Error('Not implemented.');
    }

    public override postPackageAsync(): Promise<string> {
        throw new Error('Not implemented.');
    }

    public override deletePackageAsync(): Promise<string> {
        throw new Error('Not implemented.');
    }

    public invoke(): Promise<aas.Operation> {
        throw new Error('Not implemented.');
    }

    public getBlobValueAsync(): Promise<string | undefined> {
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

    private async putSubmodelsAsync(
        destination: aas.Environment,
        submodels: IterableIterator<aas.Submodel>,
    ): Promise<string[]> {
        const messages: string[] = [];
        const aas = destination.assetAdministrationShells[0].idShort;
        for (const submodel of submodels) {
            await this.putSubmodelAsync(aas, new JsonWriterV2().convert(submodel));
        }

        return messages;
    }

    private async deleteSubmodelsAsync(
        destination: aas.Environment,
        elements: IterableIterator<aas.Submodel>,
    ): Promise<string[]> {
        const messages: string[] = [];
        const aas = destination.assetAdministrationShells[0].idShort;
        for (const element of elements) {
            messages.push(await this.deleteSubmodelAsync(aas, element.idShort));
        }

        return messages;
    }

    private putSubmodelAsync(aas: string, submodel: aasV2.Submodel): Promise<string> {
        return this.http.put(this.resolve('/aas/' + aas + '/submodels/'), submodel);
    }

    private deleteSubmodelAsync(aas: string, submodelId: string): Promise<string> {
        return this.http.delete(this.resolve('/aas/' + aas + '/submodels/' + submodelId));
    }
}
