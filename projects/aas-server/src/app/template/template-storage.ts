/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extname, join } from 'path/posix';
import { TemplateDescriptor, aas } from 'common';
import { Logger } from '../logging/logger.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { inject, singleton } from 'tsyringe';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { Variable } from '../variable.js';
import { createJsonReader } from '../packages/create-json-reader.js';
import { createXmlReader } from '../packages/create-xml-reader.js';
import { AasxDirectory } from '../packages/file-system/aasx-directory.js';
import { ScanTemplatesData } from '../aas-provider/worker-data.js';
import { ScanResult, ScanResultType, ScanStatistic, ScanTemplatesResult } from '../aas-provider/scan-result.js';
import { Parallel } from '../aas-provider/parallel.js';
import { TaskHandler } from '../aas-provider/task-handler.js';

@singleton()
export class TemplateStorage {
    private readonly fileStorage: FileStorage;
    private readonly root: string;
    private readonly timeout: number;
    private descriptors: TemplateDescriptor[] = [];

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(Variable) variable: Variable,
        @inject(FileStorageProvider) provider: FileStorageProvider,
        @inject(Parallel) private readonly parallel: Parallel,
        @inject(TaskHandler) private readonly taskHandler: TaskHandler,
    ) {
        const url = new URL(variable.TEMPLATE_STORAGE);
        this.timeout = variable.SCAN_TEMPLATES_TIMEOUT;
        this.root = url.pathname;
        url.pathname = '';
        this.fileStorage = provider.get(url);

        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
    }

    public async readTemplatesAsync(): Promise<TemplateDescriptor[]> {
        const descriptors: TemplateDescriptor[] = [];
        if ((await this.fileStorage.exists(this.root)) === true) {
            await this.readDirAsync('', descriptors);
        }

        return descriptors;
    }

    public async readTemplateAsync(path: string): Promise<aas.Referable> {
        switch (extname(path)) {
            case '.json':
                return this.readFromJson(path);
            case '.xml':
                return this.readFromXml(path);
            case '.aasx':
                return this.readFromAasx(path);
            default:
                throw new Error('Not implemented.');
        }
    }

    private startScan = async (taskId: number, statistic: ScanStatistic) => {
        const data: ScanTemplatesData = {
            type: 'ScanTemplatesData',
            taskId,
            statistic,
        };

        this.taskHandler.set(taskId, { id: 'TemplateStorage', owner: 'TemplateStorage', type: 'ScanTemplates' });
        this.parallel.execute(data);
    };

    private async readFromAasx(file: string): Promise<aas.Referable> {
        let source: AasxDirectory | undefined;
        try {
            source = new AasxDirectory(this.logger, this.fileStorage);
            await source.openAsync();
            const pkg = source.createPackage(file);
            return (await pkg.readEnvironmentAsync()).submodels[0];
        } finally {
            await source?.closeAsync();
        }
    }

    private async readFromXml(path: string): Promise<aas.Referable> {
        const xml = (await this.fileStorage.readFile(join(this.root, path))).toString();
        const env = createXmlReader(xml).readEnvironment();
        return env.submodels[0];
    }

    private async readFromJson(path: string): Promise<aas.Referable> {
        const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, path))).toString());
        return createJsonReader(referable).read(referable);
    }

    private parallelOnMessage = async (result: ScanResult) => {
        try {
            if (this.isScanTemplatesResult(result)) {
                this.descriptors = result.descriptors;
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private parallelOnEnd = async (result: ScanResult) => {
        const task = this.taskHandler.get(result.taskId);
        if (task) {
            this.taskHandler.delete(result.taskId);
            if (task.type === 'ScanTemplates') {
                setTimeout(this.startScan, this.timeout, result.taskId, result.statistic);
            }
        }

        if (result.messages) {
            this.logger.start(`scan ${task?.id ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }
    };

    private isScanTemplatesResult(result: ScanResult): result is ScanTemplatesResult {
        return Array.isArray((result as ScanTemplatesResult).descriptors);
    }
}
