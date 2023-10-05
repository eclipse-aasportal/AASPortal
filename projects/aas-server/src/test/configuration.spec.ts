/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createEndpoint, getEndpointName, getEndpointType } from "../app/configuration.js";
import { describe, it, expect } from '@jest/globals'

describe('configuration', function () {
    describe('getEndpointName', function () {
        it('gets the endpoint name from an URL string', function () {
            expect(getEndpointName('http://localhost:1234/?name=Test')).toEqual('Test');
        });

        it('gets the endpoint name from a URL', function () {
            expect(getEndpointName(new URL('http://localhost:1234/?name=Test'))).toEqual('Test');
        });

        it('gets the default name of an AASX server', function () {
            expect(getEndpointName('http://localhost:1234/')).toEqual('http://localhost:1234/');
        });

        it('gets the default name of an AAS registry', function () {
            expect(getEndpointName('http://localhost:1234/v1/registry?type=AASRegistry'))
                .toEqual('http://localhost:1234/v1/registry');
        });

        it('gets the default name of an OPCUA server', function () {
            expect(getEndpointName(new URL('opc.tcp://172.16.160.178:30001/I4AASServer')))
                .toEqual('opc.tcp://172.16.160.178:30001/I4AASServer');
        });

        it('gets the default name of an AASX directory', function () {
            expect(getEndpointName('file:///samples')).toEqual('file:///samples');
        });
    });

    describe('getEndpointType', function () {
        it('gets the endpoint type from an URL string', function () {
            expect(getEndpointType('http://localhost:1234/?type=AasxDirectory')).toEqual('AasxDirectory');
        });

        it('gets the endpoint type from a URL', function () {
            expect(getEndpointType(new URL('http://localhost:1234/?type=OpcuaServer'))).toEqual('OpcuaServer');
        });

        it('gets "AasxServer" as default', function () {
            expect(getEndpointType('http://localhost:1234/')).toEqual('AasxServer');
        });
    });

    describe('createEndpoint', function () {
        it('creates an endpoint with options', function () {
            expect(createEndpoint(
                'http://localhost:1234',
                {
                    name: 'Test',
                    params: [['version', '3.0']]
                }).href)
                .toEqual('http://localhost:1234/?name=Test&version=3.0');
        });

        it('creates an AASX server endpoint', function () {
            expect(createEndpoint('http://localhost:1234/?type=AasxServer', 'Test').href)
                .toEqual('http://localhost:1234/?name=Test');
        });

        it('creates an AAS registry endpoint', function () {
            expect(createEndpoint('http://localhost:1234/v1/registry?type=AASRegistry', 'Test').href)
                .toEqual('http://localhost:1234/v1/registry?name=Test&type=AASRegistry');
        });

        it('creates an AASX directory endpoint', function () {
            expect(createEndpoint('file:///storage/samples', 'Test').href)
                .toEqual('file:///storage/samples?name=Test');
        });
    });
});