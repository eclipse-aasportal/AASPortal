/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'common';
import { Logger } from '../logging/logger.js';
import { AASResource } from './aas-resource.js';
import { AasxDirectory } from './file-system/aasx-directory.js';
import { AASServerV0 } from './aas-server/aas-server-v0.js';
import { AASServerV3 } from './aas-server/aas-server-v3.js';
import { OpcuaServer } from './opcua/opcua-server.js';
import { ERRORS } from '../errors.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { FileStorage } from '../file-storage/file-storage.js';

@singleton()
export class AASResourceFactory {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
    ) {}

    /**
     * Creates a concrete realization of an `AASSource`.
     * @param url The URL of the container.
     * @returns A new instance of .
     */
    public create(endpoint: AASEndpoint): AASResource {
        switch (endpoint.type) {
            case 'AASServer':
                switch (endpoint.version) {
                    case 'v3':
                        return new AASServerV3(this.logger, endpoint.url, endpoint.name);
                    case 'v0':
                        return new AASServerV0(this.logger, endpoint.url, endpoint.name);
                    default:
                        throw new Error(`AASX server version ${endpoint.version} is not supported.`);
                }
            case 'OpcuaServer':
                return new OpcuaServer(this.logger, endpoint.url, endpoint.name);
            case 'WebDAV':
            case 'FileSystem': {
                const url = new URL(endpoint.url);
                url.pathname = '';
                return new AasxDirectory(this.logger, endpoint.url, endpoint.name, this.getFileStorage(url));
            }
            default:
                throw new Error('Not implemented.');
        }
    }

    /**
     * Tests whether the specified URL is a valid and supported AAS resource.
     * @param logger The logger.
     * @param url The current URL.
     */
    public async testAsync(endpoint: AASEndpoint): Promise<void> {
        try {
            switch (endpoint.type) {
                case 'AASServer':
                    switch (endpoint.version) {
                        case 'v3':
                            await new AASServerV3(this.logger, endpoint.url, endpoint.name).testAsync();
                            break;
                        case 'v0':
                            await new AASServerV0(this.logger, endpoint.url, endpoint.name).testAsync();
                            break;
                        default:
                            throw new Error(`AASX server version ${endpoint.version} is not supported.`);
                    }
                    break;
                case 'OpcuaServer':
                    await new OpcuaServer(this.logger, endpoint.url, endpoint.name).testAsync();
                    break;
                case 'WebDAV':
                case 'FileSystem':
                    {
                        const url = new URL(endpoint.url);
                        url.pathname = '';
                        await new AasxDirectory(
                            this.logger,
                            endpoint.url,
                            endpoint.name,
                            this.getFileStorage(url),
                        ).testAsync();
                    }
                    break;
                default:
                    throw new Error('Not implemented.');
            }
        } catch (error) {
            throw new ApplicationError(
                `"${endpoint.url}" addresses an invalid or not supported AAS resource.`,
                ERRORS.InvalidContainerUrl,
                endpoint.url,
            );
        }
    }

    private getFileStorage(url: string | URL): FileStorage {
        return this.fileStorageProvider.get(url);
    }
}
