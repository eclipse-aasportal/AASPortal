/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { ApplicationError } from 'common';
import { Logger } from "../logging/logger.js";
import { AASResource } from "./aas-resource.js";
import { AasxDirectory } from "./aasx-directory/aasx-directory.js";
import { AasxServerV0 } from "./aasx-server/aasx-server-v0.js";
import { AasxServerV3 } from "./aasx-server/aasx-server-v3.js";
import { OpcuaServer } from "./opcua/opcua-server.js";
import { ERRORS } from '../errors.js';
import { parseUrl } from '../convert.js';
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
    public create(url: string | URL): AASResource {
        let source: AASResource;
        const temp = typeof url === 'string' ? parseUrl(url) : url;
        switch (temp.protocol) {
            case 'http:':
            case 'https':
                const version = temp.searchParams.get('version') ?? '3.0';
                if (version === '3.0') {
                    source = new AasxServerV3(this.logger, temp);
                } else if (version === '0.0') {
                    source = new AasxServerV0(this.logger, temp);
                } else {
                    throw new Error(`AASX server version ${version} is not supported.`);
                }
                break;
            case 'opc.tcp:':
                source = new OpcuaServer(this.logger, temp);
                break;
            case 'file:':
                source = new AasxDirectory(this.logger, temp, this.createLocalFileStorage(temp));
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
    public async testAsync(url: URL): Promise<void> {
        try {
            switch (url.protocol) {
                case 'http:':
                case 'https:':
                    const version = url.searchParams.get('version') ?? '3.0';
                    if (version === '3.0') {
                        await new AasxServerV3(this.logger, url).testAsync();
                    } else if (version === '0.0') {
                        await new AasxServerV0(this.logger, url).testAsync();
                    } else {
                        throw new Error('Not implemented.');
                    }
                    break;
                case 'opc.tcp:':
                    await new OpcuaServer(this.logger, url).testAsync();
                    break;
                case 'file:':
                    await new AasxDirectory(this.logger, url, this.createLocalFileStorage(url)).testAsync();
                    break;
                default:
                    throw new Error('Not implemented.');
            }
        } catch (error) {
            throw new ApplicationError(
                `"${url.href}" addresses an invalid or not supported AAS resource.`,
                ERRORS.InvalidContainerUrl,
                url.href);
        }
    }

    private createLocalFileStorage(url: URL): FileStorage {
        return this.fileStorageFactory.create(`file:///endpoints` + url.pathname);
    }
}