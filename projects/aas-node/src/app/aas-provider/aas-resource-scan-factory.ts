/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint } from 'aas-core';
import { AASResourceScan } from './aas-resource-scan.js';
import { Logger } from '../logging/logger.js';
import { DirectoryScan } from './directory-scan.js';
import { AASServerScan } from './aas-server-scan.js';
import { OpcuaServerScan } from './opcua-server-scan.js';
import { OpcuaClient } from '../package/opcua/opcua-client.js';
import { AasxDirectory } from '../package/file-system/aasx-directory.js';
import { AASApiClient } from '../package/aas-api/aas-api-client.js';
import { AASApiClientV3 } from '../package/aas-api/aas-api-client-v3.js';
import { AASApiClientV1 } from '../package/aas-api/aas-api-client-v1.js';
import { AASApiClientV0 } from '../package/aas-api/aas-api-client-v0.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { HttpClient } from '../http-client.js';

@singleton()
export class AASResourceScanFactory {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
        @inject(HttpClient) private readonly http: HttpClient,
    ) {}

    public create(endpoint: AASEndpoint): AASResourceScan {
        switch (endpoint.type) {
            case 'AAS_API': {
                let source: AASApiClient;
                switch (endpoint.version) {
                    case 'v0':
                        source = new AASApiClientV0(this.logger, this.http, endpoint);
                        break;
                    case 'v1':
                        source = new AASApiClientV1(this.logger, this.http, endpoint);
                        break;
                    case 'v3':
                        source = new AASApiClientV3(this.logger, this.http, endpoint);
                        break;
                    default:
                        throw new Error('Not implemented.');
                }

                return new AASServerScan(this.logger, source);
            }
            case 'OPC_UA':
                return new OpcuaServerScan(this.logger, new OpcuaClient(this.logger, endpoint));
            case 'WebDAV':
            case 'FileSystem':
                return new DirectoryScan(
                    this.logger,
                    new AasxDirectory(this.logger, this.fileStorageProvider.get(endpoint.url), endpoint),
                );
            default:
                throw new Error('Not implemented.');
        }
    }
}
