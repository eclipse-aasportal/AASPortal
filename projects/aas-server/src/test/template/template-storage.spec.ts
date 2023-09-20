/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { TemplateStorage } from '../../app/template/template-storage.js';
import { createSpyObj } from '../utils.js';
import { Logger } from '../../app/logging/logger.js';
import { FileStorage } from '../../app/file-storage/file-storage.js';
import { aas } from 'common';

describe('TemplateStorage', function () {
    let templateStorage: TemplateStorage;
    let logger: jest.Mocked<Logger>;
    let fileStorage: jest.Mocked<FileStorage>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error']);
        fileStorage = createSpyObj<FileStorage>(['exists', 'readDir', 'readFile']);
        templateStorage = new TemplateStorage(logger, fileStorage);
    })

    it('should create', function () {
        expect(templateStorage).toBeTruthy();
    });

    describe('readAsync', function () {
        let submodel: aas.Submodel;

        beforeEach(function() {
            submodel = {
                id: 'http://aas/submodel',
                idShort: 'aSubmodel',
                modelType: 'Submodel'
            };
        });

        it('reads all available templates', async function () {
            fileStorage.exists.mockResolvedValue(true);
            fileStorage.readDir.mockResolvedValue(['submodel.json']);
            fileStorage.readFile.mockResolvedValue(Buffer.from(JSON.stringify({submodel})));
            await expect(templateStorage.readAsync()).resolves.toEqual([submodel]);
        });
    });
});