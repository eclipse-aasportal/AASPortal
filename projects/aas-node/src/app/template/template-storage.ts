/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extname, join } from 'path/posix';
import { AASEndpoint, TemplateDescriptor, aas } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { FileStorage } from '../file-storage/file-storage.js';
import { inject, singleton } from 'tsyringe';
import { FileStorageProvider } from '../file-storage/file-storage-provider.js';
import { Variable } from '../variable.js';
import { createJsonReader } from '../package/create-json-reader.js';
import { createXmlReader } from '../package/create-xml-reader.js';
import { AasxDirectory } from '../package/file-system/aasx-directory.js';
import { ScanTemplatesData } from '../types/worker-data.js';
import { ScanResult, ScanTemplatesResult } from '../types/scan-result.js';
import { Parallel } from '../aas-provider/parallel.js';
import { Task, TaskHandler } from '../aas-provider/task-handler.js';

@singleton()
export class TemplateStorage {
    private readonly fileStorage: FileStorage;
    private readonly root: string;
    private readonly timeout: number;
    private readonly endpoint: AASEndpoint;
    private templates: TemplateDescriptor[] = [];

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
        this.fileStorage = provider.get(url);
        this.endpoint = {
            name: url.hostname,
            type: url.protocol === 'file:' ? 'FileSystem' : 'WebDAV',
            url: url.toString(),
        };

        this.parallel.on('message', this.parallelOnMessage);
        this.parallel.on('end', this.parallelOnEnd);
    }

    public start(): void {
        setTimeout(this.startScan, 100);
    }

    public getTemplatesAsync(): Promise<TemplateDescriptor[]> {
        return Promise.resolve(this.templates);
    }

    public async readTemplateAsync(path: string): Promise<aas.Referable | aas.Environment> {
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

    private startScan = () => {
        const task = this.taskHandler.createTask('TemplateStorage', this, 'ScanTemplates');
        this.taskHandler.set(task);
        this.scanTemplates(task);
    };

    private scanTemplates = async (task: Task) => {
        const data: ScanTemplatesData = {
            type: 'ScanTemplatesData',
            taskId: task.id,
        };

        task.start = Date.now();
        task.state = 'inProgress';
        this.parallel.execute(data);
    };

    private async readFromAasx(file: string): Promise<aas.Environment> {
        let source: AasxDirectory | undefined;
        try {
            source = new AasxDirectory(this.logger, this.fileStorage, this.endpoint);
            await source.openAsync();
            const pkg = source.createPackage(file);
            return await pkg.getEnvironmentAsync();
        } finally {
            await source?.closeAsync();
        }
    }

    private async readFromXml(path: string): Promise<aas.Environment> {
        const xml = (await this.fileStorage.readFile(join(this.root, path))).toString();
        return createXmlReader(xml).readEnvironment();
    }

    private async readFromJson(path: string): Promise<aas.Referable> {
        const referable = JSON.parse((await this.fileStorage.readFile(join(this.root, path))).toString());
        return createJsonReader(referable).read(referable);
    }

    private parallelOnMessage = (result: ScanResult) => {
        try {
            if (this.isScanTemplatesResult(result)) {
                this.templates = result.templates;
            }
        } catch (error) {
            this.logger.error(error);
        }
    };

    private parallelOnEnd = (result: ScanResult) => {
        const task = this.taskHandler.get(result.taskId);
        if (task === undefined || task.owner !== this) {
            return;
        }

        task.state = 'idle';
        task.end = Date.now();
        setTimeout(this.scanTemplates, this.timeout, task);

        if (result.messages) {
            this.logger.start(`scan ${task?.endpointName ?? 'undefined'}`);
            result.messages.forEach(message => this.logger.log(message));
            this.logger.stop();
        }
    };

    private isScanTemplatesResult(result: ScanResult): result is ScanTemplatesResult {
        return result.type === 'ScanTemplatesResult';
    }
}
