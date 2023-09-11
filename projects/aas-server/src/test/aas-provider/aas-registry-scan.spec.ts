/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import http, { IncomingMessage } from 'http';
import { AASContainer } from 'common';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { AASRegistryScan } from '../../app/aas-provider/aas-registry-scan.js';
import { Logger } from '../../app/logging/logger.js';
import { Socket } from 'net';
import testRegistry from '../assets/test-registry.js'
import { createSpyObj } from '../utils.js';
import { AssetAdministrationShellDescriptor } from '../../app/types/registry.js';

describe('AASRegistryScan', function () {
    let registryScan: AASRegistryScan;
    let logger: jest.Mocked<Logger>;
    let endpoint: URL;
    let descriptors: AssetAdministrationShellDescriptor[];

    beforeEach(function () {
        descriptors = testRegistry as unknown as AssetAdministrationShellDescriptor[];
        endpoint = new URL('http://localhost/registry/api/v1/registry/');
        endpoint.searchParams.append('name', 'AAS Registry');
        endpoint.searchParams.append('type', 'AASRegistry');

        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
    });

    it('should create', function () {
        expect(new AASRegistryScan(logger, endpoint.href, [])).toBeTruthy();
    });

    it('adds new containers', async function () {
        jest.spyOn(http, 'request').mockImplementation((_, callback) => {
            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify(descriptors));
            stream.push(null);
            stream.statusCode = 201,
            stream.statusMessage = 'Created',
            (callback as (res: IncomingMessage) => void)(stream);

            return new http.ClientRequest('http://localhost:1234/registry/api/v1/registry/');
        });

        registryScan = new AASRegistryScan(logger, endpoint.href, []);
        const spy = jest.fn();
        registryScan.on('added', spy);
        await expect(registryScan.scanAsync()).resolves.toBeUndefined();
        expect(spy).toHaveBeenCalledTimes(descriptors.length);
        registryScan.off('added', spy);
    });

    it('removes unavailable containers', async function () {
        jest.spyOn(http, 'request').mockImplementation((_, callback) => {
            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify([]));
            stream.push(null);
            stream.statusCode = 200,
            stream.statusMessage = 'OK',
            (callback as (res: IncomingMessage) => void)(stream);

            return new http.ClientRequest('http://localhost:1234/registry/api/v1/registry/');
        });

        const containers: AASContainer[] = [
            {
                name: 'http://172.16.160.171:51000',
                url: 'http://172.16.160.171:51000/?type=AasxServer'
            },
            {
                name: 'http://172.16.160.188:50010',
                url: 'http://172.16.160.188:50010/?type=AasxServer'
            },
            {
                name: 'http://172.16.160.171:54000',
                url: 'http://172.16.160.171:54000/?type=AasxServer'
            }
        ];

        registryScan = new AASRegistryScan(logger, endpoint.href, containers);
        const spy = jest.fn();
        registryScan.on('removed', spy);
        await expect(registryScan.scanAsync()).resolves.toBeUndefined();
        expect(spy).toHaveBeenCalledTimes(containers.length);
        registryScan.off('removed', spy);
    });
});