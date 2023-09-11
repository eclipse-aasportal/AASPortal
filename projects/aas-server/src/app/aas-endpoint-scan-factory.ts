/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { AASEndpointScan } from './aas-provider/aas-endpoint-scan.js';
import { Logger } from './logging/logger.js';
import { getEndpointType } from './configuration.js';
import { DirectoryEndpointScan } from './aas-provider/directory-endpoint-scan.js';
import { AASXServerEndpointScan } from './aas-provider/aasx-server-endpoint-scan.js';
import { ScanEndpointData } from './aas-provider/worker-data.js';
import { AASRegistryScan } from './aas-provider/aas-registry-scan.js';
import { OpcuaEndpointScan } from './aas-provider/opcua-endpoint-scan.js';
import { AASResourceFactory } from './packages/aas-resource-factory.js';
import { FileStorageFactory } from './file-storage/file-storage-factory.js';
import { FileStorage } from './file-storage/file-storage.js';

@singleton()
export class AASEndpointScanFactory {
    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AASResourceFactory) private readonly resourceFactory: AASResourceFactory,
        @inject(FileStorageFactory) private readonly fileStorageFactory: FileStorageFactory
    ) { }

    public create(data: ScanEndpointData): AASEndpointScan {
        switch (getEndpointType(data.endpoint)) {
            case 'AasxDirectory':
                return new DirectoryEndpointScan(
                    this.logger,
                    data.endpoint,
                    this.createFileStorage(data.endpoint),
                    data.containers);
            case 'AasxServer':
                return new AASXServerEndpointScan(this.logger, this.resourceFactory, data.endpoint, data.containers);
            case 'AASRegistry':
                return new AASRegistryScan(this.logger, data.endpoint, data.containers);
            case 'OpcuaServer':
                return new OpcuaEndpointScan(this.logger, data.endpoint, data.containers);
            default:
                throw new Error();
        }
    }

    private createFileStorage(endpoint: string): FileStorage {
        const url = new URL(endpoint);
        if (url.protocol === 'file:') {
            return this.fileStorageFactory.create('file:///endpoints' + url.pathname);
        } else {
            return this.fileStorageFactory.create(url);
        }
    }
}