/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint } from 'aas-core';
import { AASServerScan } from './aas-server-scan.js';
import { LOGGER, Logger } from '../logging/logger.js';
import { DirectoryScan } from './directory-scan.js';
import { AASApiServerScan } from './aas-api-server-scan.js';
import { OpcuaServerScan } from './opcua-server-scan.js';
<<<<<<< HEAD
import { OpcuaClient } from '../package/opcua/opcua-client.js';
import { AasxDirectory } from '../package/file-system/aasx-directory.js';
import { ApiClient } from '../package/api/api-client.js';
import { ApiClientV3 } from '../package/api/api-client-v3.js';
import { ApiClientV1 } from '../package/api/api-client-v1.js';
import { ApiClientV0 } from '../package/api/api-client-v0.js';
=======
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { ApiClient } from '../client/api/api-client.js';
import { ApiClientV3 } from '../client/api/api-client-v3.js';
import { ApiClientV1 } from '../client/api/api-client-v1.js';
import { ApiClientV0 } from '../client/api/api-client-v0.js';
>>>>>>> development
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { HttpClient } from '../http-client.js';

@singleton()
export class AASServerScanFactory {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
        @inject(HttpClient) private readonly http: HttpClient,
    ) {}

    public create(endpoint: AASEndpoint): AASServerScan {
        switch (endpoint.type) {
            case 'AAS_API': {
                let source: ApiClient;
                switch (endpoint.version) {
                    case 'v0':
                        source = new ApiClientV0(this.logger, this.http, endpoint);
                        break;
                    case 'v1':
                        source = new ApiClientV1(this.logger, this.http, endpoint);
                        break;
                    case 'v3':
                        source = new ApiClientV3(this.logger, this.http, endpoint);
                        break;
                    default:
                        throw new Error('Not implemented.');
                }

                return new AASApiServerScan(source);
            }
            case 'OPC_UA':
                return new OpcuaServerScan(new OpcuaClient(this.logger, endpoint));
            case 'WebDAV':
            case 'FileSystem':
                return new DirectoryScan(
                    new AasxDirectory(this.logger, this.fileStorageProvider.get(endpoint.url), endpoint),
                );
            default:
                throw new Error('Not implemented.');
        }
    }
}
