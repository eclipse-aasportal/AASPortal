/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { TemplateDescriptor, aas } from 'aas-core';
import { TemplateStorage } from '../../app/template/template-storage.js';
import { createSpyObj } from 'fhg-jest';
import { Logger } from '../../app/logging/logger.js';
import { FileStorage } from '../../app/file-storage/file-storage.js';
import { FileStorageProvider } from '../../app/file-storage/file-storage-provider.js';
import { Variable } from '../../app/variable.js';
import { TaskHandler } from '../../app/aas-provider/task-handler.js';
import { Parallel } from '../../app/aas-provider/parallel.js';
import { ScanResultKind, ScanTemplatesResult } from '../../app/aas-provider/scan-result.js';

describe('TemplateStorage', () => {
    let templateStorage: TemplateStorage;
    let logger: jest.Mocked<Logger>;
    let fileStorage: jest.Mocked<FileStorage>;
    let fileStorageProvider: jest.Mocked<FileStorageProvider>;
    let variable: jest.Mocked<Variable>;
    let parallel: jest.Mocked<Parallel>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error']);
        fileStorageProvider = createSpyObj<FileStorageProvider>(['get']);
        fileStorage = createSpyObj<FileStorage>(['exists', 'readDir', 'readFile']);
        fileStorageProvider.get.mockReturnValue(fileStorage);
        variable = createSpyObj<Variable>([], { TEMPLATE_STORAGE: 'file:///templates' });
        parallel = createSpyObj<Parallel>(['execute', 'on']);
        parallel.on.mockImplementation((eventName, handler) => {
            if (eventName === 'message') {
                const result: ScanTemplatesResult = {
                    type: 'ScanTemplatesResult',
                    taskId: 1,
                    kind: ScanResultKind.Update,
                    templates: [
                        {
                            idShort: 'aSubmodel',
                            id: 'http://aas/submodel',
                            modelType: 'Submodel',
                            format: '.json',
                            endpoint: { type: 'file', address: 'submodel.json' },
                        },
                    ],
                };

                handler(result);
            }

            return parallel;
        });

        templateStorage = new TemplateStorage(logger, variable, fileStorageProvider, parallel, new TaskHandler());
    });

    it('should create', () => {
        expect(templateStorage).toBeTruthy();
    });

    describe('getTemplatesAsync', () => {
        it('gets all available templates', async () => {
            await expect(templateStorage.getTemplatesAsync()).resolves.toEqual([
                {
                    idShort: 'aSubmodel',
                    id: 'http://aas/submodel',
                    modelType: 'Submodel',
                    format: '.json',
                    endpoint: { type: 'file', address: 'submodel.json' },
                },
            ] as TemplateDescriptor[]);
        });
    });

    describe('readTemplateAsync', () => {
        let submodel: aas.Submodel;

        beforeEach(() => {
            submodel = {
                id: 'http://aas/submodel',
                idShort: 'aSubmodel',
                kind: 'Instance',
                modelType: 'Submodel',
            };
        });

        it('reads the template with the address "submodel.json"', async () => {
            fileStorage.readFile.mockResolvedValue(Buffer.from(JSON.stringify(submodel)));
            await expect(templateStorage.readTemplateAsync('submodel.json')).resolves.toEqual(submodel);
            expect(fileStorage.readFile).toHaveBeenCalledWith('/templates/submodel.json');
        });
    });
});
