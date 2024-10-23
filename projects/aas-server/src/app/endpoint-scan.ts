/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { Logger } from './logging/logger.js';
import { AASDocument } from 'aas-core';
import { ScanEndpointData } from './aas-provider/worker-data.js';
import { ScanEndpointResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { AASResourceScanFactory } from './aas-provider/aas-resource-scan-factory.js';
import { Variable } from './variable.js';

@singleton()
export class EndpointScan {
    private data!: ScanEndpointData;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AASResourceScanFactory) private readonly resourceScanFactory: AASResourceScanFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public async scanAsync(data: ScanEndpointData): Promise<void> {
        this.data = data;
        const scan = this.resourceScanFactory.create(data.endpoint);
        try {
            scan.on('compare', this.compare);
            scan.on('removed', this.removed);
            scan.on('error', this.onError);
            const result = await scan.scanAsync(data);
            // this.computeDeleted(result.result);
            return result.paging_metadata.cursor;
        } finally {
            scan.off('compare', this.compare);
            scan.off('removed', this.removed);
            scan.off('error', this.onError);
        }
    }

    private compare = (reference: AASDocument, document: AASDocument): void => {
        if (this.documentChanged(document, reference)) {
            this.postChanged(document);
        }
    };

    private onError = (error: Error): void => {
        this.logger.error(error);
    };

    private postChanged(document: AASDocument): void {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Changed,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private removed = (document: AASDocument): void => {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Removed,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    };

    private postAdded(document: AASDocument): void {
        const value: ScanEndpointResult = {
            taskId: this.data.taskId,
            type: ScanResultType.Added,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private documentChanged(document: AASDocument, reference: AASDocument): boolean {
        if (
            document.crc32 === reference.crc32 &&
            (!reference.timestamp || Date.now() - reference.timestamp <= this.variable.AAS_EXPIRES_IN)
        ) {
            return false;
        }

        return true;
    }
}
