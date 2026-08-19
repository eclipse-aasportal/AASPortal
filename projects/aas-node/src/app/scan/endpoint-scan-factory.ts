/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'aas-core';
import { LOGGER } from 'aas-package';
import semver from 'semver';

import { EndpointScan } from './endpoint-scan.js';
import { DirectoryScan } from './directory-scan.js';
import { AASServerScan } from './aas-server-scan.js';
import { OpcuaServerScan } from './opcua-server-scan.js';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { ApiClient } from '../client/api/api-client.js';
import { ApiClientV3 } from '../client/api/api-client-v3.js';
import { ApiClientV1 } from '../client/api/api-client-v1.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { HttpClient } from '../http-client.js';
import { ScanController } from './scan-controller.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@singleton()
export class EndpointScanFactory {
    private readonly logger = container.resolve(LOGGER);
    private readonly fileStorageProvider = container.resolve(FileStorageProvider);
    private readonly http = container.resolve(HttpClient);
    private readonly index = container.resolve(AASIndexClient);

    public create(endpoint: AASEndpoint, controller: ScanController): EndpointScan {
        switch (endpoint.type) {
            case 'AAS_API': {
                let client: ApiClient;
                const version = semver.coerce(endpoint.version) ?? '3.0.0';
                if (semver.satisfies(version, ApiClientV3.version)) {
                    client = new ApiClientV3(this.logger, this.index, endpoint, endpoint.headers, this.http);
                } else if (semver.satisfies(version, ApiClientV1.version)) {
                    client = new ApiClientV1(this.logger, this.index, endpoint, endpoint.headers, this.http);
                } else {
                    throw new ApplicationError(`AAS server version ${version} is not supported.`, {}, 500);
                }

                return new AASServerScan(controller, client);
            }
            case 'OPC_UA':
                return new OpcuaServerScan(controller, new OpcuaClient(this.logger, this.index, endpoint));
            case 'WebDAV':
            case 'FileSystem':
                return new DirectoryScan(
                    controller,
                    new AasxDirectory(this.logger, this.index, endpoint, this.fileStorageProvider.get(endpoint.url)),
                );
            default:
                throw new Error('Not implemented.');
        }
    }
}
