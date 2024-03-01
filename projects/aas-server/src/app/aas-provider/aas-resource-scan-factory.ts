/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpoint } from 'common';
import { AASResourceScan } from './aas-resource-scan.js';
import { Logger } from '../logging/logger.js';
import { DirectoryScan } from './directory-scan.js';
import { AASXServerScan } from './aasx-server-scan.js';
import { OpcuaServerScan } from './opcua-server-scan.js';
import { OpcuaServer } from '../packages/opcua/opcua-server.js';
import { AasxDirectory } from '../packages/file-system/aasx-directory.js';
import { AASServer } from '../packages/aas-server/aas-server.js';
import { AASServerV3 } from '../packages/aas-server/aas-server-v3.js';
import { AASServerV0 } from '../packages/aas-server/aas-server-v0.js';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';

@singleton()
export class AASResourceScanFactory {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(FileStorageProvider) private readonly fileStorageProvider: FileStorageProvider,
    ) {}

    public create(endpoint: AASEndpoint): AASResourceScan {
        switch (endpoint.type) {
            case 'AASServer': {
                let source: AASServer;
                switch (endpoint.version) {
                    case 'v0':
                        source = new AASServerV0(this.logger, endpoint.url, endpoint.name);
                        break;
                    case 'v3':
                        source = new AASServerV3(this.logger, endpoint.url, endpoint.name);
                        break;
                    default:
                        throw new Error('Not implemented.');
                }

                return new AASXServerScan(this.logger, source);
            }
            case 'OpcuaServer':
                return new OpcuaServerScan(this.logger, new OpcuaServer(this.logger, endpoint.url, endpoint.name));
            case 'WebDAV':
            case 'FileSystem':
                return new DirectoryScan(
                    this.logger,
                    new AasxDirectory(this.logger, this.fileStorageProvider.get(endpoint.url), endpoint.name),
                );
            default:
                throw new Error('Not implemented.');
        }
    }
}
