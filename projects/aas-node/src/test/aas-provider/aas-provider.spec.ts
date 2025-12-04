/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { AASEndpoint } from 'aas-core';

import { Logger } from '../../app/logging/logger.js';
import { AASProvider } from '../../app/provider/aas-provider.js';
import { Parallel } from '../../app/provider/parallel.js';
import { LocalFileStorage } from '../../app/file-storage/local-file-storage.js';
import { AASClientFactory } from '../../app/client/aas-client-factory.js';
import { createSpyObj } from '../mocks.js';
import { Variable } from '../../app/variable.js';
import { FileStorageProvider } from '../../app/file-storage/file-storage-provider.js';
import { AASIndex } from '../../app/index/aas-index.js';
import { TaskHandler } from '../../app/provider/task-handler.js';

describe('AASProvider', function () {
    let aasProvider: AASProvider;
    let variable: Mocked<Variable>;
    let fileStorageFactory: Mocked<FileStorageProvider>;
    let index: Mocked<AASIndex>;
    const logger = createSpyObj<Logger>(['error', 'warning', 'info']);
    const parallel = createSpyObj<Parallel>(['execute', 'on']);
    // const wsServer = createSpyObj<WSServer>(['notify', 'close', 'on']);
    const clientFactory = createSpyObj<AASClientFactory>(['create', 'testAsync']);

    beforeEach(function () {
        fileStorageFactory = createSpyObj<FileStorageProvider>(['get']);
        fileStorageFactory.get.mockReturnValue(
            new LocalFileStorage('file:///endpoints/samples', './src/test/assets/samples'),
        );

        clientFactory.testAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        variable = createSpyObj<Variable>({}, { ENDPOINTS: [] });
        index = createSpyObj<AASIndex>(['getEndpoints']);
        aasProvider = new AASProvider(variable, logger, parallel, clientFactory, index, new TaskHandler());
    });

    describe('getEndpoints', () => {
        it('gets the endpoints of all registered AAS containers', async () => {
            const endpoints: AASEndpoint[] = [{ name: 'Samples', url: '../assets/samples', type: 'FileSystem' }];
            index.getEndpoints.mockResolvedValue(endpoints);
            await expect(aasProvider.getEndpoints()).resolves.toEqual(endpoints);
        });
    });
});
