/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint, ApplicationError } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';
import semver from 'semver';

import { EndpointScanner } from './endpoint-scanner.js';
import { DirectoryScanner } from './directory-scanner.js';
import { AASServerScanner } from './aas-server-scanner.js';
import { OpcuaServerScanner } from './opcua-server-scanner.js';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { ApiClient } from '../client/api/api-client.js';
import { ApiClientV3 } from '../client/api/api-client-v3.js';
import { ApiClientV1 } from '../client/api/api-client-v1.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { HttpClient } from '../http-client.js';
import { ScannerController } from './scanner-controller.js';
import { Variable } from '../variable.js';

@singleton()
export class EndpointScannerFactory {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
        @inject(HttpClient) private readonly http: HttpClient,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public create(endpoint: AASEndpoint, controller: ScannerController): EndpointScanner {
        switch (endpoint.type) {
            case 'AAS_API': {
                let client: ApiClient;
                const version = semver.coerce(endpoint.version) ?? '3.0.0';
                if (semver.satisfies(version, ApiClientV3.version)) {
                    client = new ApiClientV3(this.logger, endpoint, endpoint.headers, this.http);
                } else if (semver.satisfies(version, ApiClientV1.version)) {
                    client = new ApiClientV1(this.logger, endpoint, endpoint.headers, this.http);
                } else {
                    throw new ApplicationError(`AAS server version ${version} is not supported.`, {}, 500);
                }

                return new AASServerScanner(controller, client);
            }
            case 'OPC_UA':
                return new OpcuaServerScanner(controller, new OpcuaClient(this.logger, endpoint));
            case 'WebDAV':
            case 'FileSystem':
                return new DirectoryScanner(
                    controller,
                    new AasxDirectory(this.logger, endpoint, this.fileStorageProvider.get(endpoint.url)),
                );
            default:
                throw new Error('Not implemented.');
        }
    }
}
