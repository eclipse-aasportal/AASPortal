/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { LOGGER, Logger } from './logging/logger.js';
import { ScanResult, ScanResultKind, WorkerData } from './types.js';
import { isScanEndpointData, isScanTemplatesData, toUint8Array } from './utilities.js';
import { EndpointScan } from './endpoint-scan.js';
import { TemplateScan } from './template/template-scan.js';

@singleton()
export class WorkerApp {
    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(EndpointScan) private readonly endpointScan: EndpointScan,
        @inject(TemplateScan) private readonly templateScan: TemplateScan,
    ) {}

    public run(): void {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private readonly parentPortOnMessage = async (data: WorkerData) => {
        if (parentPort === null) {
            return;
        }

        try {
            if (isScanEndpointData(data)) {
                await this.endpointScan.scanAsync(data);
            } else if (isScanTemplatesData(data)) {
                await this.templateScan.scanAsync(data);
            }
        } catch (error) {
            this.logger.error(error);
        } finally {
            parentPort.postMessage(toUint8Array(this.createEndResult(data)));
        }
    };

    private createEndResult(data: WorkerData): ScanResult {
        return {
            type: 'ScanEndResult',
            taskId: data.taskId,
            kind: ScanResultKind.End,
        };
    }
}
