/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { TemplateDescriptor, aas } from 'common';
import { TemplateStorage } from '../../app/template/template-storage.js';
import { createSpyObj } from '../utils.js';
import { Logger } from '../../app/logging/logger.js';
import { FileStorage, FileStorageEntry } from '../../app/file-storage/file-storage.js';
import { FileStorageProvider } from '../../app/file-storage/file-storage-provider.js';
import { Variable } from '../../app/variable.js';

describe('TemplateStorage', function () {
    let templateStorage: TemplateStorage;
    let logger: jest.Mocked<Logger>;
    let fileStorage: jest.Mocked<FileStorage>;
    let fileStorageProvider: jest.Mocked<FileStorageProvider>;
    let variable: jest.Mocked<Variable>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error']);
        fileStorageProvider = createSpyObj<FileStorageProvider>(['get']);
        fileStorage = createSpyObj<FileStorage>(['exists', 'readDir', 'readFile']);
        fileStorageProvider.get.mockReturnValue(fileStorage);

        variable = createSpyObj<Variable>([], { TEMPLATE_STORAGE: 'file:///templates' });
        templateStorage = new TemplateStorage(logger, variable, fileStorageProvider);
    });

    it('should create', function () {
        expect(templateStorage).toBeTruthy();
    });

    describe('readAsync', function () {
        let submodel: aas.Submodel;

        beforeEach(function () {
            submodel = {
                id: 'http://aas/submodel',
                idShort: 'aSubmodel',
                kind: 'Instance',
                modelType: 'Submodel',
            };
        });

        it('reads all available templates', async function () {
            fileStorage.exists.mockResolvedValue(true);
            fileStorage.readDir.mockResolvedValue([
                { name: 'submodel.json', path: '/submodel.json', type: 'file' } as FileStorageEntry,
            ]);

            fileStorage.readFile.mockResolvedValue(Buffer.from(JSON.stringify(submodel)));
            await expect(templateStorage.readAsync()).resolves.toEqual([
                {
                    name: 'submodel.json',
                    format: '.json',
                    endpoint: { type: 'file', address: 'submodel.json' },
                    template: submodel,
                },
            ] as TemplateDescriptor[]);

            expect(fileStorage.readFile).toHaveBeenCalledWith('/templates/submodel.json');
        });
    });
});
