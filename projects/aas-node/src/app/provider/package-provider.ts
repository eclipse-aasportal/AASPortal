/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import { ApplicationError } from 'aas-core';

import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { ERRORS } from '../errors.js';
import { MessageSender } from './message-sender.js';

@singleton()
export class PackageProvider {
    private sender!: MessageSender;

    public constructor(
        @inject(EndpointClientFactory) private readonly clientFactory: EndpointClientFactory,
        @inject(AAS_INDEX) private readonly index: AASIndex,
    ) {}

    /**
     * Downloads an AASX package.
     * @param endpointName The endpoint name.
     * @param id The AAS identifier.
     * @param headers The authentication header.
     * @returns A readable stream.
     */
    public async getPackage(
        endpointName: string,
        id: string,
        headers?: Record<string, string>,
    ): Promise<NodeJS.ReadableStream> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(endpoint, headers);
        try {
            await client.open();
            return await client.getPackage(id, document.address);
        } finally {
            await client.close();
        }
    }

    /**
     * Inserts an AASX package file into the AAS endpoint identified by the given name.
     * @param name The name of the AAS endpoint to which the package should be uploaded.
     * @param file The file object provided by Express/Multer containing the package data to insert.
     * @param headers The authentication header.
     * @returns A promise that resolves when the insert operation completes successfully.
     */
    public async insertPackages(
        name: string,
        file: Express.Multer.File,
        headers?: Record<string, string>,
    ): Promise<void> {
        const endpoint = await this.index.getEndpoint(name);
        if (!endpoint) {
            throw new ApplicationError(ERRORS.ENDPOINT_DOES_NOT_EXIST, { endpoint: name }, 404);
        }

        const client = this.clientFactory.create(endpoint, headers);
        try {
            await client.open();
            const aasxFile = path.join(path.dirname(file.path), file.originalname);
            if (fs.existsSync(aasxFile)) {
                await fs.promises.unlink(aasxFile);
            }

            await fs.promises.rename(file.path, aasxFile);
            await client.insertPackage(aasxFile);
            const address = await client.determineAddress(aasxFile);
            if (address) {
                const document = await client.createDocument(address);
                await this.index.insert(document);
                this.sender.send({ type: 'Added', document, start: Date.now() });
            }
        } finally {
            await client.close();
        }
    }

    /**
     * Deletes an AASX package from an endpoint.
     * @param endpointName The endpoint name.
     * @param id The AAS identification.
     * @param headers The authentication header.
     */
    public async deletePackage(endpointName: string, id: string, headers?: Record<string, string>): Promise<void> {
        const endpoint = await this.index.getEndpoint(endpointName);
        const document = await this.index.get(endpointName, 'AssetAdministrationShell', id);
        if (document) {
            const client = this.clientFactory.create(endpoint, headers);
            try {
                await client.deletePackage(document.id, document.address);
                await this.index.delete(endpointName, id);
                this.sender.send({ type: 'Removed', document: { ...document, content: null }, start: Date.now() });
            } finally {
                await client.close();
            }
        }
    }
}
