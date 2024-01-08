/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'common';
import { Logger } from "../logging/logger.js";
import { AASResource } from "./aas-resource.js";
import { AasxDirectory } from "./aasx-directory/aasx-directory.js";
import { AasxServerV0 } from "./aasx-server/aasx-server-v0.js";
import { AasxServerV3 } from "./aasx-server/aasx-server-v3.js";
import { OpcuaServer } from "./opcua/opcua-server.js";
import { ERRORS } from '../errors.js';
import { FileStorageFactory } from '../file-storage/file-storage-factory.js';
import { FileStorage } from '../file-storage/file-storage.js';

@singleton()
export class AASResourceFactory {
    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(FileStorageFactory) private readonly fileStorageFactory: FileStorageFactory
    ) { }

    /**
     * Creates a concrete realization of an `AASSource`.
     * @param url The URL of the container.
     * @returns A new instance of .
     */
    public create(endpoint: AASEndpoint): AASResource {
        let source: AASResource;
        const url = new URL(endpoint.url);
        switch (url.protocol) {
            case 'http:':
            case 'https':
                if (endpoint.version === '3.0') {
                    source = new AasxServerV3(this.logger, endpoint.url, endpoint.name);
                } else if (endpoint.version === '0.0') {
                    source = new AasxServerV0(this.logger, endpoint.url, endpoint.name);
                } else {
                    throw new Error(`AASX server version ${endpoint.version} is not supported.`);
                }
                break;
            case 'opc.tcp:':
                source = new OpcuaServer(this.logger, endpoint.url, endpoint.name);
                break;
            case 'file:':
                source = new AasxDirectory(
                    this.logger,
                    endpoint.url,
                    endpoint.name,
                    this.createLocalFileStorage(url));
                break;
            default:
                throw new Error('Not implemented.');
        }

        return source;
    }

    /**
     * Tests whether the specified URL is a valid and supported AAS resource.
     * @param logger The logger.
     * @param url The current URL.
     */
    public async testAsync(endpoint: AASEndpoint): Promise<void> {
        try {
            const url = new URL(endpoint.url);
            switch (url.protocol) {
                case 'http:':
                case 'https:':
                    const version = endpoint.version ?? '3.0';
                    if (version === '3.0') {
                        await new AasxServerV3(this.logger, endpoint.url, endpoint.name).testAsync();
                    } else if (version === '0.0') {
                        await new AasxServerV0(this.logger, endpoint.url, endpoint.name).testAsync();
                    } else {
                        throw new Error('Not implemented.');
                    }
                    break;
                case 'opc.tcp:':
                    await new OpcuaServer(this.logger, endpoint.url, endpoint.name).testAsync();
                    break;
                case 'file:':
                    await new AasxDirectory(this.logger, endpoint.url, endpoint.name, this.createLocalFileStorage(url)).testAsync();
                    break;
                default:
                    throw new Error('Not implemented.');
            }
        } catch (error) {
            throw new ApplicationError(
                `"${endpoint.url}" addresses an invalid or not supported AAS resource.`,
                ERRORS.InvalidContainerUrl,
                endpoint.url);
        }
    }

    private createLocalFileStorage(url: URL): FileStorage {
        return this.fileStorageFactory.create(`file:///endpoints` + url.pathname);
    }
}