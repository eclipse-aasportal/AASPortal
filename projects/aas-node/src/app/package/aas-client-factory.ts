/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { AASClient } from './aas-client.js';
import { AasxDirectory } from './file-system/aasx-directory.js';
import { AASApiClientV0 } from './aas-api/aas-api-client-v0.js';
import { AASApiClientV3 } from './aas-api/aas-api-client-v3.js';
import { OpcuaClient } from './opcua/opcua-client.js';
import { ERRORS } from '../errors.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { AASApiClientV1 } from './aas-api/aas-api-client-v1.js';
import { HttpClient } from '../http-client.js';

@singleton()
export class AASClientFactory {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
        @inject(HttpClient) private readonly http: HttpClient,
    ) {}

    /**
     * Creates a concrete realization of an `AASSource`.
     * @param url The URL of the container.
     * @returns A new instance of .
     */
    public create(endpoint: AASEndpoint): AASClient {
        switch (endpoint.type) {
            case 'AAS_API':
                switch (endpoint.version) {
                    case 'v3':
                        return new AASApiClientV3(this.logger, this.http, endpoint);
                    case 'v1':
                        return new AASApiClientV1(this.logger, this.http, endpoint);
                    case 'v0':
                        return new AASApiClientV0(this.logger, this.http, endpoint);
                    default:
                        throw new Error(`AASX server version ${endpoint.version} is not supported.`);
                }
            case 'OPC_UA':
                return new OpcuaClient(this.logger, endpoint);
            case 'WebDAV':
            case 'FileSystem': {
                return new AasxDirectory(this.logger, this.fileStorageProvider.get(endpoint.url), endpoint);
            }
            default:
                throw new Error('Not implemented.');
        }
    }

    /**
     * Tests whether the specified URL is a valid and supported AAS endpoint.
     * @param logger The logger.
     * @param url The current URL.
     */
    public async testAsync(endpoint: AASEndpoint): Promise<void> {
        try {
            switch (endpoint.type) {
                case 'AAS_API':
                    switch (endpoint.version) {
                        case 'v3':
                            await new AASApiClientV3(this.logger, this.http, endpoint).test();
                            break;
                        case 'v1':
                            await new AASApiClientV1(this.logger, this.http, endpoint).test();
                            break;
                        case 'v0':
                            await new AASApiClientV0(this.logger, this.http, endpoint).test();
                            break;
                        default:
                            throw new Error(`AASX server version ${endpoint.version} is not supported.`);
                    }
                    break;
                case 'OPC_UA':
                    await new OpcuaClient(this.logger, endpoint).test();
                    break;
                case 'WebDAV':
                case 'FileSystem':
                    {
                        await new AasxDirectory(
                            this.logger,
                            this.fileStorageProvider.get(endpoint.url),
                            endpoint,
                        ).test();
                    }
                    break;
                default:
                    throw new Error('Not implemented.');
            }
        } catch {
            throw new ApplicationError(
                `"${endpoint.url}" addresses an invalid or not supported AAS endpoint.`,
                ERRORS.InvalidContainerUrl,
                endpoint.url,
            );
        }
    }
}
