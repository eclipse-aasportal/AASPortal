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
import { ScanResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { EndpointScan } from './endpoint-scan.js';
import { TemplateScan } from './template/template-scan.js';
import { WorkerData, isScanEndpointData, isScanTemplatesData } from './aas-provider/worker-data.js';

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
            if (isScanEndpointData(data)) {
                await this.endpointScan.scanAsync(data);
            } else if (isScanTemplatesData(data)) {
                await this.templateScan.scanAsync(data);
            }
        } catch (error) {
            this.logger.error(error);
        } finally {
            this.logger.stop();
            parentPort.postMessage(toUint8Array(this.createEndResult(data.taskId)));
        }
    };

    private createEndResult(taskId: number): ScanResult {
        return {
            taskId: taskId,
            type: ScanResultType.End,
            messages: this.logger.getMessages(),
        };
    }
}
