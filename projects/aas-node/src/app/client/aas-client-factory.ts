/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'aas-core';
import { LOGGER, Logger } from '../logging/logger.js';
import { AASClient } from './aas-client.js';
import { AasxDirectory } from './fs/aasx-directory.js';
import { ApiClientV0 } from './api/api-client-v0.js';
import { ApiClientV3 } from './api/api-client-v3.js';
import { OpcuaClient } from './opcua/opcua-client.js';
import { ERRORS } from '../errors.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { ApiClientV1 } from './api/api-client-v1.js';
import { HttpClient } from '../http-client.js';

@singleton()
export class AASClientFactory {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
        @inject(HttpClient) private readonly http: HttpClient,
    ) {}

    /**
     * Creates a concrete realization of an endpoint client.
     * @param endpoint The endpoint.
     * @returns A new instance of an endpoint client.
     */
    public create(endpoint: AASEndpoint): AASClient {
        switch (endpoint.type) {
            case 'AAS_API':
                switch (endpoint.version) {
                    case 'v3':
                        return new ApiClientV3(this.logger, this.http, endpoint);
                    case 'v1':
                        return new ApiClientV1(this.logger, this.http, endpoint);
                    case 'v0':
                        return new ApiClientV0(this.logger, this.http, endpoint);
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
     * @param endpoint The endpoint to test.
     */
    public async testAsync(endpoint: AASEndpoint): Promise<void> {
        try {
            switch (endpoint.type) {
                case 'AAS_API':
                    switch (endpoint.version) {
                        case 'v3':
                            await new ApiClientV3(this.logger, this.http, endpoint).test();
                            break;
                        case 'v1':
                            await new ApiClientV1(this.logger, this.http, endpoint).test();
                            break;
                        case 'v0':
                            await new ApiClientV0(this.logger, this.http, endpoint).test();
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
        } catch (error) {
            let message = `"${endpoint.url}" addresses an invalid or not supported AAS endpoint.`;
            if (endpoint.url.includes('localhost') || endpoint.url.includes('127.0.0.1')) {
                message += ` Hint: If AASPortal is running in a container and your AAS endpoint is on the host machine, try using 'host.containers.internal' (Podman) or 'host.docker.internal' (Docker) instead of 'localhost'.`;
            } else if (
                endpoint.url.includes('192.168.') ||
                endpoint.url.includes('10.0.') ||
                endpoint.url.includes('172.16.')
            ) {
                message += ` Hint: Ensure the endpoint is accessible from within the container network.`;
            }

            this.logger.error(`Endpoint validation failed for ${endpoint.url}: ${error?.message || 'Unknown error'}`);

            throw new ApplicationError(ERRORS.InvalidEndpointUrl, { message, url: endpoint.url });
        }
    }
}
