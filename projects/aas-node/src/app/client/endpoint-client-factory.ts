/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';
import semver from 'semver';
import { EndpointClient } from './endpoint-client.js';
import { AasxDirectory } from './fs/aasx-directory.js';
import { ApiClientV3 } from './api/api-client-v3.js';
import { OpcuaClient } from './opcua/opcua-client.js';
import { ERRORS } from '../errors.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { ApiClientV1 } from './api/api-client-v1.js';
import { HttpClient } from '../http-client.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@singleton()
export class EndpointClientFactory {
    private readonly logger = container.resolve<Logger>(LOGGER);
    private readonly index = container.resolve(AASIndexClient);
    private readonly fileStorageProvider = container.resolve(FileStorageProvider);
    private readonly http = container.resolve(HttpClient);

    /**
     * Creates a concrete realization of an endpoint client.
     * @param endpoint The endpoint.
     * @returns A new instance of an endpoint client.
     */
    public create(endpoint: AASEndpoint, auth?: Record<string, string>): EndpointClient {
        switch (endpoint.type) {
            case 'AAS_API': {
                const version = semver.coerce(endpoint.version) ?? '3.0.0';
                if (semver.satisfies(version, ApiClientV3.version)) {
                    return new ApiClientV3(this.logger, this.index, endpoint, auth, this.http);
                } else if (semver.satisfies(version, ApiClientV1.version)) {
                    return new ApiClientV1(this.logger, this.index, endpoint, auth, this.http);
                }

                throw new ApplicationError(`AAS server version ${version} is not supported.`, {}, 500);
            }
            case 'OPC_UA':
                return new OpcuaClient(this.logger, this.index, endpoint);
            case 'WebDAV':
            case 'FileSystem': {
                return new AasxDirectory(this.logger, this.index, endpoint, this.fileStorageProvider.get(endpoint.url));
            }
            default:
                throw new Error('Not implemented.');
        }
    }

    /**
     * Tests whether the specified URL is a valid and supported AAS endpoint.
     * @param endpoint The endpoint to test.
     */
    public async testAsync(endpoint: AASEndpoint, auth: Record<string, string> | undefined): Promise<void> {
        try {
            switch (endpoint.type) {
                case 'AAS_API': {
                    switch (endpoint.version) {
                        case 'v3':
                            await new ApiClientV3(this.logger, this.index, endpoint, auth, this.http).test();
                            break;
                        case 'v1':
                            await new ApiClientV1(this.logger, this.index, endpoint, auth, this.http).test();
                            break;
                        default:
                            throw new ApplicationError(
                                `AAS server version ${endpoint.version} is not supported.`,
                                {},
                                500,
                            );
                    }

                    break;
                }
                case 'OPC_UA':
                    await new OpcuaClient(this.logger, this.index, endpoint).test();
                    break;
                case 'WebDAV':
                case 'FileSystem':
                    {
                        await new AasxDirectory(
                            this.logger,
                            this.index,
                            endpoint,
                            this.fileStorageProvider.get(endpoint.url),
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

            throw new ApplicationError(ERRORS.INVALID_ENDPOINT_URL, { message, url: endpoint.url });
        }
    }
}
