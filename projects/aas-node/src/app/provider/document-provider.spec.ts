/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { aas, AASDocument } from 'aas-core';

import { Logger } from 'aas-package';

import { DocumentProvider } from './document-provider.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { createSpyObj } from '../../test/mocks.js';
import { EndpointClient } from '../client/endpoint-client.js';
import { AASIndexClient } from '../index/aas-index-client.js';

describe('DocumentProvider', function () {
    let aasProvider: DocumentProvider;
    let index: Mocked<AASIndexClient>;
    const clientFactory = createSpyObj<EndpointClientFactory>(['create', 'testAsync']);
    const logger = createSpyObj<Logger>(['error', 'warning', 'info']);

    beforeEach(function () {
        clientFactory.testAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        index = createSpyObj<AASIndexClient>(['get', 'find', 'getEndpoint', 'getEndpoints', 'insert']);
        aasProvider = new DocumentProvider(clientFactory, index, logger);
    });

    describe('getDocument', () => {
        let document: AASDocument;
        let content: aas.Environment;
        let client: Mocked<EndpointClient>;

        beforeEach(() => {
            document = {
                id: 'TestAAS',
                endpoint: 'Samples',
                address: 'file:///endpoints/samples/TestAAS.json',
                assetId: 'TestAsset',
                idShort: '',
                timestamp: 0,
            };

            content = {
                assetAdministrationShells: [
                    {
                        id: 'TestAAS',
                        idShort: 'TestAAS',
                        assetInformation: {
                            globalAssetId: 'TestAsset',
                            assetKind: 'Instance',
                        },
                        modelType: 'AssetAdministrationShell',
                    },
                ],
                conceptDescriptions: [],
                submodels: [],
            };

            client = createSpyObj<EndpointClient>([
                'close',
                'getDocument',
                'getEnvironment',
                'getAllAssetAdministrationShellIdsByAssetLink',
                'open',
            ]);

            clientFactory.create.mockReturnValue(client);
        });

        it('gets a document by AAS ID (contained in index)', async () => {
            index.find.mockResolvedValue(document);
            client.getEnvironment.mockResolvedValue(content);
            client.getDocument.mockResolvedValue(document);
            await expect(aasProvider.getDocument('Samples', 'AssetAdministrationShell', 'TestAAS')).resolves.toEqual(
                document,
            );

            expect(index.find).toHaveBeenCalledWith('Samples', 'AssetAdministrationShell', 'TestAAS');
        });

        it('gets a document by Asset ID', async () => {
            index.find.mockResolvedValue(undefined);
            client.getAllAssetAdministrationShellIdsByAssetLink.mockResolvedValue({
                result: ['TestAAS'],
                paging_metadata: { cursor: '' },
            });

            client.getEnvironment.mockResolvedValue(content);
            client.getDocument.mockResolvedValue(document);
            await expect(aasProvider.getDocument('Samples', 'Asset', 'TestAsset')).resolves.toEqual(document);
            expect(index.find).toHaveBeenCalledWith('Samples', 'Asset', 'TestAsset');
            expect(client.getAllAssetAdministrationShellIdsByAssetLink).toHaveBeenCalledWith('TestAsset');
        });

        it('throws an error if endpoint is undefined and document not contained in index', async () => {
            index.find.mockResolvedValue(undefined);
            client.getAllAssetAdministrationShellIdsByAssetLink.mockResolvedValue({
                result: [],
                paging_metadata: { cursor: '' },
            });

            await expect(aasProvider.getDocument(undefined, 'Asset', 'TestAsset')).rejects.toThrow();
        });
    });
});
