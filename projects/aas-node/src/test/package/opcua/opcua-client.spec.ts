/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CallMethodRequestLike, CallMethodResult, ClientSession, OPCUAClient, StatusCodes, Variant } from 'node-opcua';
import { createSpyObj } from 'aas-jest';
import { LiveRequest, aas } from 'aas-core';
import { OpcuaClient } from '../../../app/package/opcua/opcua-client.js';
import { Logger } from '../../../app/logging/logger.js';
import { SocketClient } from '../../../app/live/socket-client.js';
import { aasEnvironment } from '../../assets/aas-environment.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Express } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from 'multer';

type CallMethod = (methodToCall: CallMethodRequestLike) => Promise<CallMethodResult>;

describe('OpcuaClient', () => {
    let server: OpcuaClient;
    let logger: jest.Mocked<Logger>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        server = new OpcuaClient(logger, {
            url: 'opc.tcp://localhost:1234/I4AASServer',
            name: 'OPCUA Server',
            type: 'OPC_UA',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should be created', () => {
        expect(server).toBeTruthy();
    });

    describe('testAsync', () => {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(() => {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
        });

        it('returns for a valid URL to an OPC-UA server', async () => {
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.test()).resolves.toBeUndefined();
        });

        it('throws an Error for an invalid URL', async () => {
            client.connect.mockImplementation(
                () => new Promise<void>((_, reject) => reject(new Error('Connection failed.'))),
            );

            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.test()).rejects.toThrow();
        });
    });

    describe('openAsync/closeAsync', () => {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(() => {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
        });

        it('can open/close a connection to an OPC-UA server', async () => {
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
            await expect(server.open()).resolves.toBeUndefined();
            expect(server.isOpen).toBeTruthy();
            await expect(server.close()).resolves.toBeUndefined();
            expect(server.isOpen).toBeFalsy();
        });
    });

    describe('getSession', () => {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(() => {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>([]);
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
        });

        it('returns the current session', async () => {
            await server.open();
            expect(server.getSession()).toBe(session);
            await server.close();
        });

        it('throws an Error if no connection is established', () => {
            expect(() => server.getSession()).toThrow();
        });
    });

    describe('createPackage', () => {
        it('creates a new OpcuaPackage instance', () => {
            expect(server.createPackage('ns=1;i=42')).toBeTruthy();
        });
    });

    describe('createSubscription', () => {
        it('creates a new OpcuaSubscription instance', () => {
            const request: LiveRequest = {
                endpoint: 'Test',
                id: 'opc.tcp://localhost:1234/I4AASServer',
                nodes: [
                    {
                        nodeId: 'ns=1;i=4711',
                        valueType: 'xs:integer',
                    },
                ],
            };

            expect(server.createSubscription(createSpyObj<SocketClient>({}), request)).toBeTruthy();
        });
    });

    describe('getPackage', () => {
        it('is not implemented', async () => {
            await expect(() => server.getPackage()).rejects.toThrow();
        });
    });

    describe('postPackage', () => {
        it('is not implemented', async () => {
            await expect(() => server.postPackage()).rejects.toThrow();
        });
    });

    describe('deletePackage', () => {
        it('is not implemented', async () => {
            await expect(() => server.getPackage()).rejects.toThrow();
        });
    });

    describe('invoke', () => {
        let client: jest.Mocked<OPCUAClient>;
        let session: jest.Mocked<ClientSession>;

        beforeEach(() => {
            client = createSpyObj<OPCUAClient>(['connect', 'createSession', 'closeSession', 'disconnect']);
            session = createSpyObj<ClientSession>(['call']);
            client.connect.mockImplementation(() => new Promise<void>(resolve => resolve()));
            client.createSession.mockImplementation(() => new Promise<ClientSession>(resolve => resolve(session)));
            jest.spyOn(OPCUAClient, 'create').mockReturnValue(client);
        });

        it('invokes an operation', async () => {
            const result = createSpyObj<CallMethodResult>([], {
                statusCode: StatusCodes.Good,
                outputArguments: [{ value: '3' } as Variant],
            });

            const call: CallMethod = () => {
                return new Promise<CallMethodResult>(resolve => resolve(result));
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            session.call.mockImplementation(call as any);
            const operation: aas.Operation = {
                idShort: 'add',
                modelType: 'Operation',
                methodId: 'ns=1;i=4711',
                objectId: 'ns=1;i=0815',
                inputVariables: [
                    { value: { idShort: 'a', modelType: 'Property', valueType: 'xs:int', value: '1' } as aas.Property },
                    { value: { idShort: 'b', modelType: 'Property', valueType: 'xs:int', value: '2' } as aas.Property },
                ],
                outputVariables: [
                    {
                        value: {
                            idShort: 'sum',
                            modelType: 'Property',
                            valueType: 'xs:int',
                            value: '3',
                        } as aas.Property,
                    },
                ],
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await server.open();
            await expect(server.invoke(aasEnvironment, operation)).resolves.toEqual(operation);
            await server.close();
        });

        it('throw an Error if the call result is not "Good"', async () => {
            const result = createSpyObj<CallMethodResult>([], {
                statusCode: StatusCodes.Bad,
                outputArguments: [{ value: '3' } as Variant],
            });

            const call: CallMethod = () => {
                return new Promise<CallMethodResult>(resolve => resolve(result));
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            session.call.mockImplementation(call as any);
            const operation: aas.Operation = {
                idShort: 'add',
                modelType: 'Operation',
                methodId: 'ns=1;i=4711',
                objectId: 'ns=1;i=0815',
                inputVariables: [
                    { value: { idShort: 'a', modelType: 'Property', valueType: 'xs:int', value: '1' } as aas.Property },
                    { value: { idShort: 'b', modelType: 'Property', valueType: 'xs:int', value: '2' } as aas.Property },
                ],
                outputVariables: [
                    {
                        value: {
                            idShort: 'sum',
                            modelType: 'Property',
                            valueType: 'xs:int',
                            value: '3',
                        } as aas.Property,
                    },
                ],
                parent: {
                    type: 'ModelReference',
                    keys: [{ type: 'Submodel', value: 'http://i40.customer.com/type/1/1/F13E8576F6488342' }],
                },
            };

            await server.open();
            await expect(server.invoke(aasEnvironment, operation)).rejects.toThrow();
            await server.close();
        });
    });
});
