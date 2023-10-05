/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { OpcuaServer } from '../../../app/packages/opcua/opcua-server.js';
import { Logger } from '../../../app/logging/logger.js';
import { createSpyObj } from '../../utils.js';
import { CallMethodRequestLike, CallMethodResult, ClientSession, OPCUAClient, StatusCodes, Variant } from 'node-opcua';
import { SocketClient } from '../../../app/live/socket-client.js';
import { LiveRequest, aas } from 'common';
import env from '../../assets/aas-environment.js';

type CallMethod = (methodToCall: CallMethodRequestLike) => Promise<CallMethodResult>;

describe('OpcuaServer', function () {
    let server: OpcuaServer;
    let logger: jest.Mocked<Logger>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = new OpcuaServer(logger, 'opc.tcp://localhost:1234/I4AASServer');
    });

    it('should be created', function () {
        expect(server).toBeTruthy();
    });

    describe('testAsync', function () {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(function () {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
        });

        it('returns for a valid URL to an OPC-UA server', async function () {
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.testAsync()).resolves.toBeUndefined();
        });

        it('throws an Error for an invalid URL', async function () {
            client.connect.mockImplementation(() => new Promise<void>((_, reject) => reject(new Error('Connection failed.'))));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.testAsync()).rejects.toThrowError();
        });
    });

    describe('openAsync/closeAsync', function () {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(function () {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
        });

        it('can open/close a connection to an OPC-UA server', async function () {
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.openAsync()).resolves.toBeUndefined();
            expect(server.isOpen).toBeTruthy();
            await expect(server.closeAsync()).resolves.toBeUndefined();
            expect(server.isOpen).toBeFalsy();
        });
    });

    describe('getSession', function () {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(function () {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
        });

        it('returns the current session', async function () {
            await server.openAsync();
            expect(server.getSession()).toBe(session);
            await server.closeAsync();
        });

        it('throws an Error if no connection is established', function () {
            expect(() => server.getSession()).toThrowError();
        });
    });

    describe('createPackage', function () {
        it('creates a new OpcuaPackage instance', function () {
            expect(server.createPackage('ns=1;i=42')).toBeTruthy();
        });
    });

    describe('createSubscription', function () {
        it('creates a new OpcuaSubscription instance', function () {
            const request: LiveRequest = {
                type: 'opc',
                id: 'opc.tcp://localhost:1234/I4AASServer',
                url: 'http://customer.com/aas/9175_7013_7091_9168',
                nodes: [{
                    nodeId: 'ns=1;i=4711',
                    valueType: 'xs:integer'
                }]
            };

            expect(server.createSubscription(createSpyObj<SocketClient>({}), request)).toBeTruthy();
        });
    });

    describe('getPackageAsync', function () {
        it('is not implemented', function () {
            expect(() => server.getPackageAsync('aasId', 'name')).toThrowError();
        });
    });

    describe('postPackageAsync', function () {
        it('is not implemented', function () {
            expect(() => server.postPackageAsync(createSpyObj<Express.Multer.File>({}))).toThrowError();
        });
    });

    describe('deletePackageAsync', function () {
        it('is not implemented', function () {
            expect(() => server.getPackageAsync('aasId', 'name')).toThrowError();
        });
    });

    describe('invoke', function () {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(function () {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>(['call']);
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
        });

        it('invokes an operation', async function () {
            const result = createSpyObj<CallMethodResult>([], {
                statusCode: StatusCodes.Good,
                outputArguments: [
                    { value: '3' } as Variant
                ]
            });

            const call: CallMethod = () => {
                return new Promise<CallMethodResult>(resolve => resolve(result));
            };

            session.call.mockImplementation(call as any);
            const operation: aas.Operation = {
                idShort: 'add',
                modelType: 'Operation',
                methodId: 'ns=1;i=4711',
                objectId: 'ns=1;i=0815',
                inputVariables: [
                    { value: { idShort: 'a', modelType: 'Property', valueType: 'xs:int', value: '1' } as aas.Property },
                    { value: { idShort: 'b', modelType: 'Property', valueType: 'xs:int', value: '2' } as aas.Property }
                ],
                outputVariables: [
                    { value: { idShort: 'sum', modelType: 'Property', valueType: 'xs:int', value: '3' } as aas.Property },
                ],
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }]
                }
            };

            await server.openAsync();
            await expect(server.invoke(env, operation)).resolves.toEqual(operation);
            await server.closeAsync();
        });

        
        it('throw an Error if the call result is not "Good"', async function () {
            const result = createSpyObj<CallMethodResult>([], {
                statusCode: StatusCodes.Bad,
                outputArguments: [
                    { value: '3' } as Variant
                ]
            });

            const call: CallMethod = () => {
                return new Promise<CallMethodResult>(resolve => resolve(result));
            };

            session.call.mockImplementation(call as any);
            const operation: aas.Operation = {
                idShort: 'add',
                modelType: 'Operation',
                methodId: 'ns=1;i=4711',
                objectId: 'ns=1;i=0815',
                inputVariables: [
                    { value: { idShort: 'a', modelType: 'Property', valueType: 'xs:int', value: '1' } as aas.Property },
                    { value: { idShort: 'b', modelType: 'Property', valueType: 'xs:int', value: '2' } as aas.Property }
                ],
                outputVariables: [
                    { value: { idShort: 'sum', modelType: 'Property', valueType: 'xs:int', value: '3' } as aas.Property },
                ],
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }]
                }
            };

            await server.openAsync();
            await expect(server.invoke(env, operation)).rejects.toThrowError();
            await server.closeAsync();
        });
    });
}); 