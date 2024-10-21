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
import { ScanNextPageResult, ScanResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { EndpointScan } from './endpoint-scan.js';
import { TemplateScan } from './template/template-scan.js';
import {
    ScanEndpointData,
    ScanTemplatesData,
    WorkerData,
    isScanEndpointData,
    isScanTemplatesData,
} from './aas-provider/worker-data.js';

@singleton()
export class WorkerApp {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(EndpointScan) private readonly endpointScan: EndpointScan,
        @inject(TemplateScan) private readonly templateScan: TemplateScan,
    ) {}

    public run(): void {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private parentPortOnMessage = async (data: WorkerData) => {
        if (parentPort === null) {
            return;
        }

        try {
            this.logger.start(`Scan ${data.taskId}`);
            let result: ScanResult;

            if (isScanEndpointData(data)) {
                result = await this.scanEndpoint(data);
            } else if (isScanTemplatesData(data)) {
                result = await this.scanTemplates(data);
            } else {
                result = {
                    taskId: data.taskId,
                    type: ScanResultType.End,
                    messages: this.logger.getMessages(),
                };
            }

            parentPort.postMessage(toUint8Array(result));
        } catch (error) {
            this.logger.error(error);
            this.logger.stop();
            const result: ScanResult = {
                taskId: data.taskId,
                type: ScanResultType.End,
                messages: this.logger.getMessages(),
            };

            parentPort.postMessage(toUint8Array(result));
        }
    };

    private async scanEndpoint(data: ScanEndpointData): Promise<ScanResult> {
        const cursor = await this.endpointScan.scanAsync(data);
        this.logger.stop();

        if (cursor) {
            return {
                taskId: data.taskId,
                type: ScanResultType.NextPage,
                cursor,
                messages: this.logger.getMessages(),
            } as ScanNextPageResult;
        }

        return {
            taskId: data.taskId,
            type: ScanResultType.End,
            messages: this.logger.getMessages(),
        } as ScanResult;
    }

    private async scanTemplates(data: ScanTemplatesData): Promise<ScanResult> {
        await this.templateScan.scanAsync(data);
        this.logger.stop();

        return {
            taskId: data.taskId,
            type: ScanResultType.End,
            messages: this.logger.getMessages(),
        } as ScanResult;
    }
}
