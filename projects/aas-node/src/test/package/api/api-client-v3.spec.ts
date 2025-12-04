/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { createSpyObj } from '../../mocks.js';
import { aasEnvironment as env } from '../../assets/aas-environment.js';
import { ApiClientV3, OperationResult } from '../../../app/client/api/api-client-v3.js';
import { aas } from 'aas-core';
import { Logger } from '../../../app/logging/logger.js';
import { HttpClient } from '../../../app/http-client.js';

describe('ApiClientV3', () => {
    let logger: Logger;
    let client: ApiClientV3;
    let http: Mocked<HttpClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        http = createSpyObj<HttpClient>(['get', 'getResponse', 'post', 'put', 'delete']);
        client = new ApiClientV3(logger, http, {
            name: 'AASX Server',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });
    });

    describe('resolveNodeId', () => {
        let shell: Mocked<aas.AssetAdministrationShell>;

        beforeEach(() => {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { id: 'http://localhost/test/aas' });
        });

        it('returns the URL to "property1"', () => {
            const aasId = Buffer.from('http://localhost/test/aas').toString('base64url');
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64url');
            const nodeId = smId + '#property1';
            expect(client.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/shells/${aasId}/submodels/${smId}/submodel-elements/property1`,
            );
        });
    });

    describe('writeEnvironment', () => {
        it('updates an AssetAdministrationShell', async () => {
            const aas = env.assetAdministrationShells[0];
            const content: aas.Environment = {
                assetAdministrationShells: [aas],
                submodels: [],
                conceptDescriptions: [],
            };

            http.get.mockResolvedValue(aas);
            http.put.mockResolvedValue('OK');

            await expect(client.setEnvironment(aas.id, content)).resolves.toBe(void 0);
            expect(http.get).toHaveBeenCalled();
            expect(http.put).toHaveBeenCalled();
        });

        it('adds a new AssetAdministrationShell', async () => {
            const aas = env.assetAdministrationShells[0];
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

            http.post.mockResolvedValue(JSON.stringify(result));

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await expect(client.invoke(env, operation)).resolves.toEqual(operation);
        });

        it('throws an error if the operation fails', async () => {
            const result: OperationResult = {
                executionState: 'Failed',
                success: false,
            };

            http.post.mockResolvedValue(JSON.stringify(result));

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await expect(client.invoke(env, operation)).rejects.toThrow();
        });
    });
});
