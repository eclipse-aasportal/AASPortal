/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AASEndpoint } from 'common';

import { Logger } from '../../app/logging/logger.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { Parallel } from '../../app/aas-provider/parallel.js';
import { LocalFileStorage } from '../../app/file-storage/local-file-storage.js';
import { AASResourceFactory } from '../../app/packages/aas-resource-factory.js';
import { createSpyObj } from '../utils.js';
import { Variable } from '../../app/variable.js';
import { FileStorageFactory } from '../../app/file-storage/file-storage-factory.js';
import { AASIndex } from '../../app/aas-index/aas-index.js';

describe('AASProvider', function () {
    let aasProvider: AASProvider;
    let variable: jest.Mocked<Variable>;
    let fileStorageFactory: jest.Mocked<FileStorageFactory>;
    let index: jest.Mocked<AASIndex>;
    const logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
    const parallel = createSpyObj<Parallel>(['execute', 'on']);
    // const wsServer = createSpyObj<WSServer>(['notify', 'close', 'on']);
    const resourceFactory = createSpyObj<AASResourceFactory>(['create', 'testAsync']);

    beforeEach(function () {
        fileStorageFactory = createSpyObj<FileStorageFactory>(['create']);
        fileStorageFactory.create.mockReturnValue(new LocalFileStorage('./src/test/assets/samples'));
        resourceFactory.testAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        variable = createSpyObj<Variable>({}, { ENDPOINTS: [] });
        index = createSpyObj<AASIndex>(['getEndpoints']);
        aasProvider = new AASProvider(variable, logger, parallel, resourceFactory, index);
    });

    describe('getEndpoints', () => {
        it('gets the endpoints of all registered AAS containers', async () => {
            const endpoints: AASEndpoint[] = [{ name: 'Samples', url: '../assets/samples', type: 'AasxDirectory' }];
            index.getEndpoints.mockResolvedValue(endpoints);
            await expect(aasProvider.getEndpoints()).resolves.toEqual(endpoints);
        });
    });
});
