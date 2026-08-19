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

import { EndpointScanFactory } from './endpoint-scan-factory.js';
import { Variable } from '../variable.js';
import { CommandData, EventData } from '../types.js';
import { ScanController } from './scan-controller.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@singleton()
export class ScanApp {
    private endpoint = '';
    private taskId = 0;
    private start = 0;
    private readonly controller: ScanController = new ScanController();

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(AASIndexClient) private readonly index: AASIndexClient,
        @inject(EndpointScanFactory) private readonly factory: EndpointScanFactory,
        @inject(Variable) private readonly variable: Variable,
    ) {}

    public run(): void {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private readonly parentPortOnMessage = async (data: CommandData): Promise<void> => {
        if (parentPort === null) {
            return;
        }

        try {
            if (data.name === 'ScanEndpoint') {
                const endpoint = data.args.endpoint as AASEndpoint;
                this.endpoint = endpoint.name;
                this.taskId = Number(data.args.taskId);
                await this.scan(endpoint);
            } else if (data.name === 'CancelScan') {
                this.taskId = Number(data.args.taskId);
                this.endpoint = String(data.args.endpoint);
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
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'Start',
            args: { taskId: this.taskId, endpoint: this.endpoint, start: this.start },
        };

        parentPort?.postMessage(data);
    }

    private postUpdate(document: AASDocument): void {
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'Updated',
            args: { taskId: this.taskId, endpoint: this.endpoint, document: document, start: this.start },
        };

        parentPort?.postMessage(data);
    }

    private readonly postRemove = (document: AASDocument): void => {
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'Removed',
            args: { taskId: this.taskId, endpoint: this.endpoint, document: document, start: this.start },
        };

        parentPort?.postMessage(data);
    };

    private readonly postAdd = (document: AASDocument): void => {
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'Added',
            args: { taskId: this.taskId, endpoint: this.endpoint, document: document, start: this.start },
        };

        parentPort?.postMessage(data);
    };

    private readonly postProgress = (progress: number, shellCount: number, submodelCount: number): void => {
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'Progress',
            args: {
                taskId: this.taskId,
                endpoint: this.endpoint,
                shellCount: shellCount,
                submodelCount: submodelCount,
                progress: progress,
                start: this.start,
            },
        };

        parentPort?.postMessage(data);
    };

    private postEnd(): void {
        const data: EventData = {
            application: 'ScanApp',
            type: 'event',
            name: 'End',
            args: { taskId: this.taskId, endpoint: this.endpoint, start: this.start },
        };

        parentPort?.postMessage(data);
    }
}
