/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { AASDocument, ApplicationError } from 'common';

import { encodeBase64Url } from '../convert.js';
import { getEndpointName } from '../configuration.js';
import { ERRORS } from '../errors.js';

/** A container of Asset Administration Shells. */
export class Container {
    private readonly rootDir: string;

    constructor(
        rootDir: string,
        url: string,
        public readonly name: string,
        configurationEndpoint: string) {

        this.url = new URL(url);
        this.name = name;
        this.configurationEndpoints = [configurationEndpoint];
        this.base64Url = encodeBase64Url(url);
        this.rootDir = path.join(rootDir, this.base64Url);

        if (!fs.existsSync(this.rootDir)) {
            fs.mkdirSync(this.rootDir);
        }
    }

    public readonly url: URL;

    public readonly base64Url: string;

    public readonly configurationEndpoints: string[];

    public async *documents(): AsyncIterableIterator<AASDocument> {
        const s = this.base64Url + '-';
        return (await fs.promises.readdir(this.rootDir)).filter(file => file.startsWith(s));
    }

    public has(id: string): boolean {
        return fs.existsSync(path.join(this.rootDir, `${encodeBase64Url(id)}.json`));
    }

    public async getAsync(id: string): Promise<AASDocument> {
        try {
            const buffer = await fs.promises.readFile(
                path.join(this.rootDir, `${encodeBase64Url(id)}.json`));

            return JSON.parse(buffer.toString());
        } catch (_) {
            throw new ApplicationError(
                `An AAS with the identification ${id} does not exist in the container '${this.url}'.`,
                ERRORS.AASNotFound,
                id,
                this.url);
        }
    }

    public async addAsync(aas: AASDocument): Promise<void> {
        const file = path.join(this.rootDir, `${encodeBase64Url(aas.id)}.json`);
        await fs.promises.writeFile(file, JSON.stringify(aas));
    }

    public deleteAsync(id: string): Promise<void> {
        const file = path.join(this.rootDir, `${encodeBase64Url(id)}.json`);
        return fs.promises.unlink(file);
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