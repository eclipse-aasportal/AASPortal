/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { Logger } from './logging/logger.js';
import { ScanEndpointData } from './aas-provider/worker-data.js';
import { ScanEndpointResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { AASEndpointScan } from './aas-provider/aas-endpoint-scan.js';
import { AASContainer, AASEndpoint } from 'common';
import { noop } from 'lodash-es';
import { UpdateStatistic } from './update-statistic.js';
import { AASEndpointScanFactory } from './aas-endpoint-scan-factory.js';

@singleton()
export class ScanEndpoint {
    private data!: ScanEndpointData;

    constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AASEndpointScanFactory) private readonly endpointScanFactory: AASEndpointScanFactory,
        @inject(UpdateStatistic) private readonly statistic: UpdateStatistic
    ) { }

    public async scanAsync(data: ScanEndpointData): Promise<void> {
        this.data = data;
        let scan: AASEndpointScan | undefined;
        try {
            scan = this.endpointScanFactory.create(data);
            scan.on('added', this.onContainerAdded);
            scan.on('removed', this.onContainerRemoved);
            scan.on('error', this.onError);
            await scan.scanAsync();
        } finally {
            scan?.removeAllListeners();
        }
    }

    private onContainerAdded = (endpoint: AASEndpoint, container: AASContainer): void => {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.ContainerAdded,
            endpoint: endpoint,
            container: container,
            statistic: this.statistic.update(this.data.statistic, ScanResultType.ContainerAdded)
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private onContainerRemoved = (endpoint: AASEndpoint, container: AASContainer) => {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.ContainerRemoved,
            container: container,
            endpoint: endpoint,
            statistic: this.statistic.update(this.data.statistic, ScanResultType.ContainerRemoved)
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private onError = (): void => {
        noop();
    }
}