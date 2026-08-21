/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { aas } from 'aas-core';
import { Logger } from 'aas-package';

import { createSpyObj } from '../../../test/mocks.js';
import { aasEnvironment as env } from '../../../test/assets/aas-environment.js';
import { ApiClientV3, OperationResult } from './api-client-v3.js';
import { HttpClient } from '../../http-client.js';
import { AASIndexClient } from '../../index/aas-index-client.js';

describe('ApiClientV3', () => {
    let logger: Mocked<Logger>;
    let client: ApiClientV3;
    let http: Mocked<HttpClient>;
    let index: Mocked<AASIndexClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        index = createSpyObj<AASIndexClient>(['getConceptDescriptionRefs']);
        http = createSpyObj<HttpClient>(['get', 'getReadable', 'post', 'postFormData', 'put', 'delete']);
        client = new ApiClientV3(
            logger,
            index,
            {
                name: 'AASX Server',
                type: 'AAS_API',
                url: 'http://localhost:1234',
            },
            undefined,
            http,
        );
    });

    describe('resolveNodeId', () => {
        let shell: Mocked<aas.AssetAdministrationShell>;

        beforeEach(() => {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { id: 'http://localhost/test/aas' });
        });

        it('returns the URL to "property1"', () => {
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64url');
            const nodeId = smId + '#property1';
            expect(client.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/submodels/${smId}/submodel-elements/property1`,
            );
        });
    });

    describe('getAllAssetAdministrationShellIdsByAssetLink', () => {
        const assetId = 'https://i4d.de/ed9a62426c5b587b69a7b482e137c487';

        it('returns the result from /lookup/shells when it has a match', async () => {
            http.get.mockResolvedValueOnce({ result: ['shell1'], paging_metadata: {} });

            await expect(client.getAllAssetAdministrationShellIdsByAssetLink(assetId)).resolves.toEqual({
                result: ['shell1'],
                paging_metadata: {},
            });

            expect(http.get).toHaveBeenCalledTimes(1);
        });

        it('falls back to filtering /shells when /lookup/shells has no match', async () => {
            // /lookup/shells: a registry index that is out of sync -- responds 200 with an empty result
            http.get.mockResolvedValueOnce({ result: [], paging_metadata: {} });
            // /shells?assetId=...: the repository itself, filtered server-side, has the shell
            const shell: aas.AssetAdministrationShell = {
                modelType: 'AssetAdministrationShell',
                id: 'https://i4d.de/shells/control-cabinet',
                idShort: 'ControlCabinet',
                assetInformation: { assetKind: 'Instance', globalAssetId: assetId },
            };
            http.get.mockResolvedValueOnce({ result: [shell], paging_metadata: {} });

            await expect(client.getAllAssetAdministrationShellIdsByAssetLink(assetId)).resolves.toEqual({
                result: [shell.id],
                paging_metadata: {},
            });

            expect(http.get).toHaveBeenCalledTimes(2);
            const shellsUrl = http.get.mock.calls[1][0] as URL;
            expect(shellsUrl.pathname).toBe('/shells');
            expect(shellsUrl.searchParams.get('assetId')).toBe(assetId);
        });

        it('returns an empty result when neither /lookup/shells nor /shells has a match', async () => {
            http.get.mockResolvedValueOnce({ result: [], paging_metadata: {} });
            http.get.mockResolvedValueOnce({ result: [], paging_metadata: {} });

            await expect(client.getAllAssetAdministrationShellIdsByAssetLink(assetId)).resolves.toEqual({
                result: [],
                paging_metadata: {},
            });
        });

        it('falls back to /shells when /lookup/shells is not implemented (404)', async () => {
            http.get.mockRejectedValueOnce(new Error('Not Found'));
            const shell: aas.AssetAdministrationShell = {
                modelType: 'AssetAdministrationShell',
                id: 'https://i4d.de/shells/control-cabinet',
                idShort: 'ControlCabinet',
                assetInformation: { assetKind: 'Instance', globalAssetId: assetId },
            };
            http.get.mockResolvedValueOnce({ result: [shell], paging_metadata: {} });

            await expect(client.getAllAssetAdministrationShellIdsByAssetLink(assetId)).resolves.toEqual({
                result: [shell.id],
                paging_metadata: {},
            });
        });
    });

    describe('setEnvironment', () => {
        it('updates an AssetAdministrationShell', async () => {
            const aas = env.assetAdministrationShells![0];
            const content: aas.Environment = {
                assetAdministrationShells: [aas],
                submodels: [],
                conceptDescriptions: [],
            };

            http.get.mockResolvedValue(aas);
            http.put.mockResolvedValue(void 0);

            await expect(client.setEnvironment(aas.id, content)).resolves.toBe(void 0);
            expect(http.get).toHaveBeenCalled();
            expect(http.put).toHaveBeenCalled();
        });

        it('adds a new AssetAdministrationShell', async () => {
            const aas = env.assetAdministrationShells![0];
            const content: aas.Environment = {
                assetAdministrationShells: [aas],
                submodels: [],
                conceptDescriptions: [],
            };

            http.get.mockRejectedValue(new Error());
            http.post.mockResolvedValue('OK');

            await expect(client.setEnvironment(aas.id, content)).resolves.toBe(void 0);
            expect(http.get).toHaveBeenCalled();
            expect(http.post).toHaveBeenCalled();
        });
    });

    describe('invoke', () => {
        it('invokes an operation synchronously', async () => {
            const result: OperationResult = {
                executionState: 'Completed',
                success: true,
            };

            http.post.mockResolvedValue(result);

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                path: {
                    id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                    idShortPath: 'noop',
                },
            };

            await expect(client.invoke(operation)).resolves.toEqual(operation);
        });

        it('throws an error if the operation fails', async () => {
            const result: OperationResult = {
                executionState: 'Failed',
                success: false,
            };

            http.post.mockResolvedValue(result);

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                path: {
                    id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                    idShortPath: 'noop',
                },
            };

            await expect(client.invoke(operation)).rejects.toThrow();
        });
    });

    describe('getSubmodels', () => {
        it('returns a paged result of submodels', async () => {
            const submodel: aas.Submodel = {
                idShort: 'submodel1',
                modelType: 'Submodel',
                id: 'http://localhost/test/submodel1',
            };

            const pagedResult = {
                items: [submodel],
                cursor: undefined,
            };

            http.get.mockResolvedValue(pagedResult);

            await expect(client.getSubmodels(undefined)).resolves.toEqual(pagedResult);
        });
    });

    describe('getConceptDescriptions', () => {
        it('returns a paged result of concept descriptions', async () => {
            const conceptDescription: aas.ConceptDescription = {
                idShort: 'conceptDescription1',
                modelType: 'ConceptDescription',
                id: 'http://localhost/test/conceptDescription1',
            };

            const pagedResult = {
                items: [conceptDescription],
                cursor: undefined,
            };

            http.get.mockResolvedValue(pagedResult);

            await expect(client.getConceptDescriptions(undefined)).resolves.toEqual(pagedResult);
        });
    });
});
