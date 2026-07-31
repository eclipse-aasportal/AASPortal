/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { LOGGER, Logger } from 'aas-package';

import { AASDocument, AASEndpoint } from 'aas-core';

import { toUint8Array } from '../utilities.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointScannerFactory } from './endpoint-scanner-factory.js';
import { Variable } from '../variable.js';
import { isCancelEndpointScanData, isEndpointScanData, EndpointScanMessage, WorkerData } from '../types.js';
import { ScannerController } from './scanner-controller.js';

@singleton()
export class ScanApp {
    private endpoint = '';
    private taskId = 0;
    private start = 0;
    private readonly controller: ScannerController = new ScannerController();

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(AAS_INDEX) private readonly index: AASIndex,
        @inject(EndpointScannerFactory) private readonly factory: EndpointScannerFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public run(): void {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private readonly parentPortOnMessage = async (data: WorkerData): Promise<void> => {
        if (parentPort === null) {
            return;
        }

        try {
            if (isEndpointScanData(data)) {
                this.endpoint = data.endpoint.name;
                this.taskId = data.taskId;
                await this.scan(data.endpoint);
            } else if (isCancelEndpointScanData(data)) {
                this.taskId = data.taskId;
                this.endpoint = data.endpoint;
                await this.cancel();
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private async scan(endpoint: AASEndpoint): Promise<void> {
        const scanner = this.factory.create(endpoint, this.controller);
        try {
            scanner.on('update', this.postUpdate);
            scanner.on('remove', this.postRemove);
            scanner.on('add', this.postAdd);
            scanner.on('progress', this.postProgress);
            scanner.on('error', this.onError);
            this.logger.info(`Start scanning endpoint ${endpoint.name}.`);
            this.start = Date.now();
            this.postStart();
            await scanner.scan(this.index, endpoint);
            const duration = (Date.now() - this.start) / 1000;
            this.logger.info(`Finished scanning endpoint ${endpoint.name} in ${duration} s.`);
        } finally {
            this.controller.end();
            scanner.off('update', this.postUpdate);
            scanner.off('remove', this.postRemove);
            scanner.off('add', this.postAdd);
            scanner.off('progress', this.postProgress);
            scanner.off('error', this.onError);
            scanner.destroy();
            this.postEnd();
        }
    }

    private cancel(): Promise<void> {
        return this.controller.cancel();
    }

    private onError = (error: Error): void => {
        this.logger.error(error);
    };

    private postStart(): void {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            kind: 'Start',
            endpoint: this.endpoint,
            start: this.start,
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    }

    private postUpdate(document: AASDocument): void {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            kind: 'Updated',
            endpoint: this.endpoint,
            document: document,
            start: this.start,
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    }

    private postRemove = (document: AASDocument): void => {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            kind: 'Removed',
            endpoint: this.endpoint,
            document: document,
            start: this.start,
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    };

    private postAdd = (document: AASDocument): void => {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            kind: 'Added',
            endpoint: this.endpoint,
            document: document,
            start: this.start,
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    };

    private readonly postProgress = (progress: number, shellCount: number, submodelCount: number): void => {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            kind: 'Progress',
            endpoint: this.endpoint,
            shellCount: shellCount,
            submodelCount: submodelCount,
            progress: progress,
            start: this.start,
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    };

    private postEnd(): void {
        const array = toUint8Array({
            type: 'EndpointScanMessage',
            taskId: this.taskId,
            endpoint: this.endpoint,
            start: this.start,
            kind: 'End',
        } satisfies EndpointScanMessage);

        parentPort?.postMessage(array, [array.buffer]);
    }
}
