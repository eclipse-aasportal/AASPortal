/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { LOGGER, Logger } from './logging/logger.js';
import { AASDocument } from 'aas-core';
import { ScanEndpointData, ScanEndpointResult, ScanResultKind } from './types.js';
import { toUint8Array } from './utilities.js';
import { EndpointScannerFactory } from './scan/endpoint-scanner-factory.js';
import { Variable } from './variable.js';
import { AAS_INDEX, AASIndex } from './index/aas-index.js';

@singleton()
export class EndpointScan {
    private data!: ScanEndpointData;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(AAS_INDEX) private readonly index: AASIndex,
        @inject(EndpointScannerFactory) private readonly factory: EndpointScannerFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public async scanAsync(data: ScanEndpointData): Promise<void> {
        this.data = data;
        const scan = this.factory.create(data.endpoint);
        try {
            scan.on('compare', this.compare);
            scan.on('remove', this.postRemove);
            scan.on('add', this.postAdd);
            scan.on('error', this.onError);
            this.logger.info(`Start scanning endpoint ${data.endpoint.name} with task id ${data.taskId}.`);
            const start = Date.now();
            await scan.scanAsync(this.index, data.endpoint);
            const duration = (Date.now() - start) / 1000;
            this.logger.info(
                `Finished scanning endpoint ${data.endpoint.name} with task id ${data.taskId} in ${duration} s.`,
            );
        } finally {
            scan.off('compare', this.compare);
            scan.off('remove', this.postRemove);
            scan.off('add', this.postAdd);
            scan.off('error', this.onError);
        }
    }

    private compare = (a: AASDocument, b: AASDocument): void => {
        if (this.documentChanged(a, b)) {
            this.postUpdate(b);
        }
    };

    private onError = (error: Error): void => {
        this.logger.error(error);
    };

    private postUpdate(document: AASDocument): void {
        const value: ScanEndpointResult = {
            type: 'ScanEndpointResult',
            taskId: this.data.taskId,
            kind: ScanResultKind.Update,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    }

    private postRemove = (document: AASDocument): void => {
        const value: ScanEndpointResult = {
            type: 'ScanEndpointResult',
            taskId: this.data.taskId,
            kind: ScanResultKind.Remove,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    };

    private postAdd = (document: AASDocument): void => {
        const value: ScanEndpointResult = {
            type: 'ScanEndpointResult',
            taskId: this.data.taskId,
            kind: ScanResultKind.Add,
            endpoint: this.data.endpoint,
            document: document,
        };

        const array = toUint8Array(value);
        parentPort?.postMessage(array, [array.buffer]);
    };

    private documentChanged(a: AASDocument, b: AASDocument): boolean {
        if (
            a.crc32 === b.crc32 &&
            a.thumbnail === b.thumbnail &&
            (!b.timestamp || Date.now() - b.timestamp <= this.variable.AAS_EXPIRES_IN)
        ) {
            return false;
        }

        return true;
    }
}
