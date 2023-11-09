/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AasxPackage } from '../../../app/packages/aasx-directory/aasx-package.js'
import { AasxDirectory } from '../../../app/packages/aasx-directory/aasx-directory.js';
import { Logger } from '../../../app/logging/logger.js';
import { LocalFileStorage } from '../../../app/file-storage/local-file-storage.js';
import { createSpyObj, fail } from '../../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { FileStorage } from '../../../app/file-storage/file-storage.js';

describe('AasxPackage', function () {
    let logger: jest.Mocked<Logger>;
    let source: AasxDirectory;
    let fileStorage: FileStorage;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        fileStorage = new LocalFileStorage('./src/test/assets/samples');
        source = new AasxDirectory(logger, 'file:///samples', 'Samples', fileStorage);
    });

    describe('createDocumentAsync', function () {
        it('creates a document from a xml origin', async function () {
            try {
                await source.openAsync();
                const aasxPackage = new AasxPackage(logger, source, 'xml-origin.aasx');
                const document = aasxPackage.createDocumentAsync();
                expect(document).toBeDefined();
            } catch (error) {
                fail(error?.message)
            } finally {
                await source.closeAsync();
            }
        });

        it('creates a document from a json origin', async function () {
            try {
                await source.openAsync();
                const aasxPackage = new AasxPackage(logger, source, 'json-origin.aasx');
                const document = aasxPackage.createDocumentAsync();
                expect(document).toBeDefined();
            } catch (error) {
                fail(error?.message);
            } finally {
                await source.closeAsync();
            }
        });
    });
});
