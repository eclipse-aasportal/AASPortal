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
import { WorkerData, isScanContainerData, isScanTemplates } from './aas-provider/worker-data.js';
import { ScanResult, ScanResultType } from './aas-provider/scan-result.js';
import { toUint8Array } from './convert.js';
import { UpdateStatistic } from './update-statistic.js';
import { ScanContainer } from './scan-container.js';
import { TemplateScan } from './template/template-scan.js';

@singleton()
export class WorkerApp {
    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(ScanContainer) private readonly scanContainer: ScanContainer,
        @inject(TemplateScan) private readonly templateScan: TemplateScan,
        @inject(UpdateStatistic) private readonly statistic: UpdateStatistic,
    ) {}

    public run(): void {
        parentPort?.on('message', this.parentPortOnMessage);
    }

    private parentPortOnMessage = async (data: WorkerData) => {
        try {
            this.logger.start(`Scan ${data.taskId}`);
            if (isScanContainerData(data)) {
                await this.scanContainer.scanAsync(data);
            } else if (isScanTemplates(data)) {
                await this.templateScan.scanAsync(data);
            }
        } catch (error) {
            this.logger.error(error);
        } finally {
            this.logger.stop();
            const result: ScanResult = {
                taskId: data.taskId,
                type: ScanResultType.End,
                statistic: this.statistic.update(data.statistic, ScanResultType.End),
                messages: this.logger.getMessages(),
            };

            parentPort?.postMessage(toUint8Array(result));
        }
    };
}
