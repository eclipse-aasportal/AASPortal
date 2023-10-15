/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import net from 'net';
import { AASXServerEndpointScan } from '../../app/aas-provider/aasx-server-endpoint-scan.js';
import { Logger } from '../../app/logging/logger.js';
import { createSpyObj } from '../utils.js';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { createEndpoint } from '../../app/configuration.js';
import { AASResourceFactory } from '../../app/packages/aas-resource-factory.js';
import { AASResource } from '../../app/packages/aas-resource.js';

describe('AasxServerEndpointScan', function () {
    let logger: jest.Mocked<Logger>;
    let resourceFactory: jest.Mocked<AASResourceFactory>;
    let resource: jest.Mocked<AASResource>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        resource = createSpyObj<AASResource>(['openAsync', 'closeAsync']);
        resourceFactory = createSpyObj<AASResourceFactory>(['create']);
        resourceFactory.create.mockReturnValue(resource);
    });

    describe('added', function () {
        let scan: AASXServerEndpointScan;
        let socket: jest.Mocked<net.Socket>;

        beforeEach(function () {
            scan = new AASXServerEndpointScan(
                logger,
                resourceFactory,
                createEndpoint('http://localhost:1234', 'aasx server').href,
                []);

            socket = createSpyObj<net.Socket>(['on', 'setTimeout', 'end']);
            socket.on.mockImplementation((event, listener) => {
                if (event === 'connect') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });
        });

        it('adds an available AASX server', async function () {
            jest.spyOn(net, 'createConnection').mockImplementation(() => {
                return socket;
            });

            const spy = jest.fn();
            scan.on('added', spy);
            await scan.scanAsync();
            expect(spy).toHaveBeenCalled();
            scan.off('added', spy);
        });
    });

    describe('removed', function () {
        let scan: AASXServerEndpointScan;
        let socket: jest.Mocked<net.Socket>;

        beforeEach(function () {
            const endpoint = createEndpoint('http://localhost:1234', 'aasx server').href;
            scan = new AASXServerEndpointScan(
                logger,
                resourceFactory,
                endpoint,
                [{ name: 'aasx server', url: endpoint }]);

            socket = createSpyObj<net.Socket>(['on', 'setTimeout', 'destroy']);
            socket.on.mockImplementation((event, listener) => {
                if (event === 'timeout') {
                    setTimeout(() => (listener as () => void)());
                }

                return socket;
            });
        });

        it('removes an unavailable AASX server', async function () {
            resource.openAsync.mockReturnValue(new Promise<void>((_, reject) => reject(new Error())));
            jest.spyOn(net, 'createConnection').mockImplementation(() => {
                return socket;
            });

            const removedSpy = jest.fn();
            scan.on('removed', removedSpy);
            await scan.scanAsync();
            expect(removedSpy).toHaveBeenCalled();
            scan.off('removed', removedSpy);
        });
    });
});