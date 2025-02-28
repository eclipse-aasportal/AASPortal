/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { AASEndpoint } from 'aas-core';
import { urlToEndpoint } from '../app/configuration.js';

describe('configuration', () => {
    describe('urlToEndpoint', () => {
        it('gets an endpoint from an URL string', () => {
            expect(urlToEndpoint('http://localhost:1234/?name=Test')).toEqual({
                name: 'Test',
                url: 'http://localhost:1234/',
                type: 'AAS_API',
                version: 'v3',
            } as AASEndpoint);
        });

        it('gets an endpoint from an URL', () => {
            expect(urlToEndpoint(new URL('http://localhost:1234/?name=Test&type=aas-api'))).toEqual({
                name: 'Test',
                url: 'http://localhost:1234/',
                type: 'AAS_API',
                version: 'v3',
            } as AASEndpoint);
        });

        it('gets the endpoint name from a URL', () => {
            expect(urlToEndpoint('http://localhost:1234/?name=Test&version=v2')).toEqual({
                name: 'Test',
                url: 'http://localhost:1234/',
                type: 'AAS_API',
                version: 'v2',
            } as AASEndpoint);
        });

        it('gets an endpoint of an AASX server', () => {
            expect(urlToEndpoint('http://localhost:1234/')).toEqual({
                name: 'http://localhost:1234/',
                url: 'http://localhost:1234/',
                type: 'AAS_API',
                version: 'v3',
            } as AASEndpoint);
        });

        it('gets an endpoint of an WebDAV server', () => {
            expect(urlToEndpoint('http://localhost:1234/endpoints/samples?type=webdav')).toEqual({
                name: 'samples',
                url: 'http://localhost:1234/endpoints/samples',
                type: 'WebDAV',
                version: 'v3',
            } as AASEndpoint);
        });

        it('gets an endpoint of an OPCUA server', () => {
            expect(urlToEndpoint(new URL('opc.tcp://172.16.160.178:30001/I4AASServer?version=v1'))).toEqual({
                name: 'I4AASServer',
                url: 'opc.tcp://172.16.160.178:30001/I4AASServer',
                type: 'OPC_UA',
                version: 'v1',
            } as AASEndpoint);
        });

        it('gets an endpoint of an local directory', () => {
            expect(urlToEndpoint('file:///endpoints/samples')).toEqual({
                name: 'samples',
                url: 'file:///endpoints/samples',
                type: 'FileSystem',
                version: 'v3',
            } as AASEndpoint);
        });
    });
});