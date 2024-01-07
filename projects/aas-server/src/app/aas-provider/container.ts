/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, isUrlSafeBase64 } from 'common';
import { decodeBase64Url } from '../convert.js';
import { getEndpointName } from '../configuration.js';

/** A container of Asset Administration Shells. */
export class Container {
    private readonly _documents = new Map<string, AASDocument>();

    constructor(
        url: string,
        name: string,
        configurationEndpoint: string) {

        this.url = new URL(url);
        this.name = name;
        this.configurationEndpoints = [configurationEndpoint];
    }

    public readonly url: URL;

    public readonly name: string;

    public readonly configurationEndpoints: string[];

    /** The AAS documents. */
    public get documents(): IterableIterator<AASDocument> {
        return this._documents.values();
    }

    public has(id: string): boolean {
        return this._documents.has(id);
    }

    public find(id: string): AASDocument | undefined {
        let document = this._documents.get(id);
        if (!document) {
            let decodedId: string | undefined;
            try {
                if (isUrlSafeBase64(id)) {
                    decodedId = decodeBase64Url(id);
                }
            } catch (_) { }

            for (const item of this._documents.values()) {
                if (item.idShort === id || item.id === decodedId) {
                    document = item;
                    break;
                }
            }
        }

        return document;
    }

    public get(id: string): AASDocument {
        const document = this._documents.get(id);
        if (!document) {
            throw new Error(`An AAS with the identification '${id}' does not exist.`);
        }

        return document;
    }

    public set(aas: AASDocument): void {
        this._documents.set(aas.id, aas);
    }

    public remove(id: string): boolean {
        return this._documents.delete(id);
    }

    public toString(): string {
        return `URL = ${this.url.href}`;
    }

    public isAssignedTo(configurationEndpoint: URL): boolean {
        const name = getEndpointName(configurationEndpoint);
        return this.configurationEndpoints.some(item => getEndpointName(item) === name);
    }

    public assignTo(configurationEndpoint: URL): void {
        this.configurationEndpoints.push(configurationEndpoint.href);
    }

    public unassignFrom(configurationEndpoint: URL): boolean {
        const name = getEndpointName(configurationEndpoint);
        const index = this.configurationEndpoints.findIndex(item => getEndpointName(item) === name);
        if (index >= 0) {
            this.configurationEndpoints.splice(index, 1);
        }

        return this.configurationEndpoints.length === 0;
    }
}