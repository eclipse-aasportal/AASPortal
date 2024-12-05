/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSpyObj } from 'fhg-jest';
import env from '../../assets/aas-environment.js';
import cloneDeep from 'lodash-es/cloneDeep.js';
import { AASApiClientV3, OperationResult } from '../../../app/packages/aas-server/aas-api-client-v3.js';
import { aas, DifferenceItem } from 'aas-core';
import { Logger } from '../../../app/logging/logger.js';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { HttpClient } from '../../../app/http-client.js';

describe('AASApiClientV3', () => {
    let logger: Logger;
    let client: AASApiClientV3;
    let http: jest.Mocked<HttpClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        http = createSpyObj<HttpClient>(['get', 'getResponse', 'post', 'put', 'delete']);
        client = new AASApiClientV3(logger, http, {
            name: 'AASX Server',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });
    });

    describe('resolveNodeId', () => {
        let shell: jest.Mocked<aas.AssetAdministrationShell>;

        beforeEach(() => {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { id: 'http://localhost/test/aas' });
        });

        it('returns the URL to "property1"', () => {
            const aasId = Buffer.from('http://localhost/test/aas').toString('base64url');
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64url');
            const nodeId = smId + '.submodel1/property1';
            expect(client.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/shells/${aasId}/submodels/${smId}/submodel-elements/property1`,
            );
        });
    });

    describe('commitAsync', () => {
        let source: aas.Environment;
        let destination: aas.Environment;

        beforeEach(async () => {
            source = env;
            destination = cloneDeep(source);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('inserts a submodel', async () => {
            http.post.mockResolvedValue('Submodel inserted.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'inserted',
                    sourceElement: source.submodels[0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel inserted.']);
        });

        it('inserts a submodel-element', async () => {
            http.post.mockResolvedValue('SubmodelElement inserted.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'inserted',
                    sourceParent: source.submodels[0],
                    sourceElement: source.submodels[0].submodelElements![0],
                    destinationParent: destination.submodels[0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual([
                'SubmodelElement inserted.',
            ]);
        });

        it('updates a submodel', async () => {
            http.put.mockResolvedValue('Submodel updated.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'changed',
                    sourceElement: source.submodels[0],
                    destinationElement: destination.submodels[0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel updated.']);
        });

        it('updates a submodel-element', async () => {
            http.put.mockResolvedValue('SubmodelElement updated.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'changed',
                    sourceParent: source.submodels[0],
                    sourceElement: source.submodels[0].submodelElements![0],
                    destinationParent: destination.submodels[0],
                    destinationElement: destination.submodels[0].submodelElements![0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual(['SubmodelElement updated.']);
        });

        it('deletes a submodel', async () => {
            http.delete.mockResolvedValue('Submodel deleted.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'deleted',
                    destinationElement: destination.submodels[0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel deleted.']);
        });

        it('deletes a submodel-element', async () => {
            http.delete.mockResolvedValue('SubmodelElement deleted.');
            const diffs: DifferenceItem[] = [
                {
                    type: 'deleted',
                    destinationParent: destination.submodels[0],
                    destinationElement: destination.submodels[0].submodelElements![0],
                },
            ];

            await expect(client.commitAsync(source, destination, diffs)).resolves.toEqual(['SubmodelElement deleted.']);
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

            await expect(client.invoke(env, operation)).rejects.toThrowError();
        });
    });
});
