/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { Readable } from 'stream';
import { AASDocument, aas } from 'common';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { Logger } from '../../app/logging/logger.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { Parallel } from '../../app/aas-provider/parallel.js';
import { LocalFileStorage } from '../../app/file-storage/local-file-storage.js';
import { AASPackage } from '../../app/packages/aas-package.js';
import { sampleDocument } from '../assets/sample-document.js';
import { AASResourceFactory } from '../../app/packages/aas-resource-factory.js';
import { AASResource } from '../../app/packages/aas-resource.js';
import { createSpyObj } from '../utils.js';
import { AASServerConfiguration, createEndpoint } from '../../app/configuration.js';
import { AASResourceScanFactory } from '../../app/aas-provider/aas-resource-scan-factory.js';
import { WSServer } from '../../app/ws-server.js';
import { Variable } from '../../app/variable.js';
import { FileStorageFactory } from '../../app/file-storage/file-storage-factory.js';
import { AASIndex } from '../../app/aas-provider/aas-index.js';

describe.skip('AASProvider', function () {
    let aasProvider: AASProvider;
    let variable: jest.Mocked<Variable>;
    let fileStorageFactory: jest.Mocked<FileStorageFactory>;
    let index: jest.Mocked<AASIndex>;
    const logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
    const parallel = createSpyObj<Parallel>(['execute', 'on']);
    const wsServer = createSpyObj<WSServer>(['notify', 'close', 'on']);
    const resourceFactory = createSpyObj<AASResourceFactory>(['create', 'testAsync']);

    beforeEach(function () {
        fileStorageFactory = createSpyObj<FileStorageFactory>(['create']);
        fileStorageFactory.create.mockReturnValue(new LocalFileStorage('./src/test/assets/samples'));
        resourceFactory.testAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        variable = createSpyObj<Variable>({}, { ENDPOINTS: [] });
    });

    describe('addEndpointAsync', function () {
        beforeEach(function () {
            variable.ENDPOINTS.push(createEndpoint('file:///shop', 'Shop').href);
            aasProvider = new AASProvider(
                variable, {
                endpoints: [
                    createEndpoint('file:///shop', 'Shop').href
                ]
            },
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
        });

        it('adds an existing endpoint to the configuration', async function () {
            await aasProvider.addEndpointAsync('samples', createEndpoint('file:///samples', 'samples'));
            const workspaces = aasProvider.getWorkspaces();
            expect(workspaces.length).toEqual(2);
        });
    });

    describe('removeEndpointAsync', function () {
        beforeEach(function () {
            variable.ENDPOINTS.push(
                createEndpoint('file:///shop', 'Shop').href,
                createEndpoint('file:///samples', 'Samples').href);

            aasProvider = new AASProvider(
                variable, {
                endpoints:
                    [
                        createEndpoint('file:///shop', 'Shop').href,
                        createEndpoint('file:///samples', 'Samples').href
                    ]
            },
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
        });

        it('removes an endpoint from the configuration', async function () {
            await aasProvider.removeEndpointAsync('Shop');
            const workspaces = aasProvider.getWorkspaces();
            expect(workspaces.length).toEqual(1);
            if (workspaces.length > 0) {
                expect(workspaces[0].name).toEqual('Samples');
            } else {
                expect(workspaces.length).toBeGreaterThan(0);
            }
        });
    });

    describe('resetAsync', function () {
        beforeEach(function () {
            variable.ENDPOINTS.push(
                createEndpoint('file:///shop', 'Shop').href,
                createEndpoint('file:///samples', 'Samples').href);

            const configuration: AASServerConfiguration = {
                endpoints: [
                    createEndpoint('file:///samples', 'Samples').href
                ]
            };

            aasProvider = new AASProvider(
                variable,
                configuration,
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
        });

        it('resets the configuration', async function () {
            let workspaces = aasProvider.getWorkspaces();
            expect(workspaces.length).toEqual(1);
            expect(workspaces[0].name).toEqual('Samples');

            await aasProvider.resetAsync();
            workspaces = aasProvider.getWorkspaces();
            expect(workspaces.length).toEqual(2);
            expect(workspaces[0].name).toEqual('Shop');
            expect(workspaces[1].name).toEqual('Samples');
        });
    });

    describe('getPackageAsync', function () {
        beforeEach(async function () {
            const configuration: AASServerConfiguration = {
                endpoints: [createEndpoint('file:///samples', 'Samples').href]
            };

            variable.ENDPOINTS.push(createEndpoint('file:///samples', 'Samples').href);
            aasProvider = new AASProvider(
                variable,
                configuration,
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
            await aasProvider.scanAsync(new AASResourceScanFactory(logger, fileStorageFactory));
        });

        it('downloads an AASX package', async function () {
            const source = createSpyObj<AASResource>(['openAsync', 'closeAsync', 'getPackageAsync']);
            source.getPackageAsync.mockReturnValue(new Promise<NodeJS.ReadableStream>(resolve => {
                const stream = new Readable();
                stream.push('Hello World!');
                stream.push(null);
                resolve(stream);
            }));

            resourceFactory.create.mockReturnValue(source);
            await expect(aasProvider.getPackageAsync(
                'http://customer.com/aas/9175_7013_7091_9168',
                'file:///samples')).resolves.toBeDefined();
        });
    });

    describe('addDocumentAsync', function () {
        beforeEach(async function () {
            const configuration: AASServerConfiguration = {
                endpoints: [createEndpoint('file:///samples', 'Samples').href]
            };

            variable.ENDPOINTS.push(createEndpoint('file:///samples', 'Samples').href);
            aasProvider = new AASProvider(
                variable,
                configuration,
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
            await aasProvider.scanAsync(new AASResourceScanFactory(logger, fileStorageFactory));
        });

        it('uploads an AASX package', async function () {
            const source = createSpyObj<AASResource>(['openAsync', 'closeAsync', 'postPackageAsync']);
            const aasPackage = createSpyObj<AASPackage>(['createDocumentAsync']);
            aasPackage.createDocumentAsync.mockReturnValue(new Promise<AASDocument>(resolve => resolve(sampleDocument)));
            source.postPackageAsync.mockReturnValue(new Promise<AASPackage>(resolve => resolve(aasPackage)));
            resourceFactory.create.mockReturnValue(source);
            await expect(aasProvider.addPackagesAsync(
                'file:///samples',
                [createSpyObj<Express.Multer.File>(['buffer'])])).resolves.toBeUndefined();
        });
    });

    describe('deletePackageAsync', function () {
        beforeEach(async function () {
            const configuration: AASServerConfiguration = {
                endpoints: [createEndpoint('file:///samples', 'Samples').href]
            };

            variable.ENDPOINTS.push(createEndpoint('file:///samples', 'Samples').href);
            aasProvider = new AASProvider(
                variable,
                configuration,
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
            await aasProvider.scanAsync(new AASResourceScanFactory(logger, fileStorageFactory));
        });

        it('deletes an AASX package', async function () {
            const source = createSpyObj<AASResource>(['openAsync', 'closeAsync', 'deletePackageAsync']);
            source.deletePackageAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
            resourceFactory.create.mockReturnValue(source);
            await expect(aasProvider.deleteDocumentAsync(
                'file:///samples',
                'http://customer.com/aas/9175_7013_7091_9168')).resolves.toBeUndefined();

            expect(source.deletePackageAsync).toHaveBeenCalled();
        });
    });

    describe('invoke', function () {
        beforeEach(async function () {
            const configuration: AASServerConfiguration = {
                endpoints: [createEndpoint('file:///samples', 'Samples').href]
            };

            variable.ENDPOINTS.push(createEndpoint('file:///samples', 'Samples').href);
            aasProvider = new AASProvider(
                variable,
                configuration,
                logger,
                parallel,
                resourceFactory,
                index);

            aasProvider.start(wsServer);
            await aasProvider.scanAsync(new AASResourceScanFactory(logger, fileStorageFactory));
        });

        it('invokes an operation', async function () {
            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation'
            };

            const source = createSpyObj<AASResource>(['openAsync', 'closeAsync', 'invoke']);
            source.invoke.mockReturnValue(new Promise<aas.Operation>(resolve => resolve(operation)));
            resourceFactory.create.mockReturnValue(source);

            await expect(aasProvider.invoke(
                'file:///samples',
                'http://customer.com/aas/9175_7013_7091_9168',
                operation)).resolves.toEqual(operation);

            expect(source.openAsync).toHaveBeenCalled();
            expect(source.invoke).toHaveBeenCalled();
            expect(source.closeAsync).toHaveBeenCalled();
        });
    });
});