/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, DifferenceItem, selectSubmodel } from 'common';
import { Logger } from '../../logging/logger.js';
import { JsonReaderV2 } from '../json-reader-v2.js';
import { AasxServer } from './aasx-server.js';
import { JsonWriterV2 } from '../json-writer-v2.js';
import * as aasV2 from '../../types/aas-v2.js';

interface AASList {
    aaslist: string[];
}

export class AasxServerV0 extends AasxServer {
    constructor(logger: Logger, url: string, name: string) {
        super(logger, url, name);
    }

    public override readonly version = '0.0';

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getShellsAsync(): Promise<string[]> {
        const value = await this.message.get<AASList>(this.resolve('/server/listaas'));
        return value.aaslist.map(item => item.split(' : ')[1].trim())
    }

    public override async readEnvironmentAsync(id: string): Promise<aas.Environment> {
        const url = this.resolve(`/aas/${id}/aasenv`);
        const sourceEnv = await this.message.get<aasV2.AssetAdministrationShellEnvironment>(url);
        return new JsonReaderV2(this.logger, sourceEnv).readEnvironment();
    }

    public override getThumbnailAsync(): Promise<NodeJS.ReadableStream> {
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async commitAsync(
        source: aas.Environment,
        destination: aas.Environment,
        diffs: DifferenceItem[]): Promise<string[]> {
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
            messages.push(...await this.putSubmodelsAsync(destination, updateSubmodels.values()));
        }

        if (deleteSubmodels.size > 0) {
            messages.push(...await this.deleteSubmodelsAsync(destination, deleteSubmodels.values()));
        }

        return messages;
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const items = nodeId.split('.')[1].split('/');
        const path = items.slice(1).join('/');
        return this.resolve(`/aas/${shell.idShort}/submodels/${items[0]}/elements/${path}/value`).href;
    }

    public async openFileAsync(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const url = await this.getFileUrlAsync(shell.idShort, file.value!);
        return await this.message.getResponse(url);
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
        const listAAS = await this.message.get<AASList>(this.resolve('/server/listaas'));
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
        submodels: IterableIterator<aas.Submodel>): Promise<string[]> {
        const messages: string[] = [];
        const aas = destination.assetAdministrationShells[0].idShort;
        for (const submodel of submodels) {
            await this.putSubmodelAsync(aas, new JsonWriterV2().write(submodel));
        }

        return messages;
    }

    private async deleteSubmodelsAsync(
        destination: aas.Environment,
        elements: IterableIterator<aas.Submodel>): Promise<string[]> {
        const messages: string[] = [];
        const aas = destination.assetAdministrationShells[0].idShort;
        for (const element of elements) {
            messages.push(await this.deleteSubmodelAsync(aas, element.idShort));
        }

        return messages;
    }

    private putSubmodelAsync(aas: string, submodel: aas.Submodel): Promise<string> {
        return this.message.put(this.resolve('/aas/' + aas + '/submodels/'), new JsonWriterV2().write(submodel));
    }

    private deleteSubmodelAsync(aas: string, submodelId: string): Promise<string> {
        return this.message.delete(this.resolve('/aas/' + aas + '/submodels/' + submodelId));
    }
}