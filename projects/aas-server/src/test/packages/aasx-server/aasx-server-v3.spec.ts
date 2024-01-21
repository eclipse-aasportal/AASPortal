/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import http, { IncomingMessage } from 'http';
import env from '../../assets/aas-environment.js';
import { AasxServerV3, OperationResult } from '../../../app/packages/aasx-server/aasx-server-v3.js';
import { aas, DifferenceItem } from 'common';
import { cloneDeep } from 'lodash-es';
import { Socket } from 'net';
import { Logger } from '../../../app/logging/logger.js';
import { createSpyObj } from '../../utils.js';
import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';

describe('AasxServerV3', function () {
    let logger: Logger;
    let server: AasxServerV3;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = new AasxServerV3(logger, 'http://localhost:1234', 'AASX Server');
    });

    describe('resolveNodeId', function () {
        let shell: jest.Mocked<aas.AssetAdministrationShell>;

        beforeEach(function () {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { id: 'http://localhost/test/aas' });
        });

        it('returns the URL to "property1"', function () {
            const aasId = Buffer.from('http://localhost/test/aas').toString('base64url');
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64url');
            const nodeId = smId + '.submodel1/property1';
            expect(server.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/shells/${aasId}/submodels/${smId}/submodel-elements/property1`,
            );
        });
    });

    describe('commitAsync', function () {
        let source: aas.Environment;
        let destination: aas.Environment;

        beforeEach(async function () {
            source = env;
            destination = cloneDeep(source);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('inserts a submodel', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('Submodel inserted.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 201;
                stream.statusMessage = 'Created';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'inserted',
                    sourceElement: source.submodels[0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel inserted.']);
        });

        it('inserts a submodel-element', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('SubmodelElement inserted.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 201;
                stream.statusMessage = 'Created';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'inserted',
                    sourceParent: source.submodels[0],
                    sourceElement: source.submodels[0].submodelElements![0],
                    destinationParent: destination.submodels[0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual([
                'SubmodelElement inserted.',
            ]);
        });

        it('updates a submodel', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('Submodel updated.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 200;
                stream.statusMessage = 'OK';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'changed',
                    sourceElement: source.submodels[0],
                    destinationElement: destination.submodels[0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel updated.']);
        });

        it('updates a submodel-element', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('SubmodelElement updated.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 200;
                stream.statusMessage = 'OK';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'changed',
                    sourceParent: source.submodels[0],
                    sourceElement: source.submodels[0].submodelElements![0],
                    destinationParent: destination.submodels[0],
                    destinationElement: destination.submodels[0].submodelElements![0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual(['SubmodelElement updated.']);
        });

        it('deletes a submodel', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('Submodel deleted.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 204;
                stream.statusMessage = 'No Content';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'deleted',
                    destinationElement: destination.submodels[0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual(['Submodel deleted.']);
        });

        it('deletes a submodel-element', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push('SubmodelElement deleted.');
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 204;
                stream.statusMessage = 'No Content';
                return new http.ClientRequest('http://localhost:1234');
            });

            const diffs: DifferenceItem[] = [
                {
                    type: 'deleted',
                    destinationParent: destination.submodels[0],
                    destinationElement: destination.submodels[0].submodelElements![0],
                },
            ];

            await expect(server.commitAsync(source, destination, diffs)).resolves.toEqual(['SubmodelElement deleted.']);
        });
    });

    describe('invoke', function () {
        it('invokes an operation synchronously', async function () {
            const result: OperationResult = {
                executionState: 'Completed',
                success: true,
            };

            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify(result));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 204;
                stream.statusMessage = 'No Content';
                return new http.ClientRequest('http://localhost:1234');
            });

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await expect(server.invoke(env, operation)).resolves.toEqual(operation);
        });

        it('throws an error if the server returns with status code 500', async function () {
            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 500;
                stream.statusMessage = 'Internal server error.';
                return new http.ClientRequest('http://localhost:1234');
            });

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await expect(server.invoke(env, operation)).rejects.toThrowError();
        });

        it('throws an error if the operation fails', async function () {
            const result: OperationResult = {
                messages: [{ messageType: 'Error', text: 'Operation failed.' }],
                executionState: 'Failed',
                success: false,
            };

            jest.spyOn(http, 'request').mockImplementation((options, callback) => {
                const stream = new IncomingMessage(new Socket());
                stream.push(JSON.stringify(result));
                stream.push(null);
                (callback as (res: IncomingMessage) => void)(stream);
                stream.statusCode = 204;
                stream.statusMessage = 'No Content';
                return new http.ClientRequest('http://localhost:1234');
            });

            const operation: aas.Operation = {
                idShort: 'noop',
                modelType: 'Operation',
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await expect(server.invoke(env, operation)).rejects.toThrowError();
        });
    });
});
