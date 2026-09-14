/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { EventEmitter } from 'events';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AASDocument, AASEndpoint } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';

import { createSpyObj } from '../../test/mocks.js';
import { AASIndexClient } from '../index/aas-index-client.js';
import { EndpointScan } from './endpoint-scan.js';
import { EndpointScanFactory } from './endpoint-scan-factory.js';
import { ScanApp } from './scan-app.js';
import { AAS_INDEX } from '../index/aas-index.js';

const { parentPort } = vi.hoisted(() => ({
    parentPort: {
        on: vi.fn(),
        postMessage: vi.fn(),
    },
}));

vi.mock('worker_threads', () => ({ parentPort }));

describe('ScanApp', () => {
    let factory: ReturnType<typeof createSpyObj<EndpointScanFactory>>;

    beforeEach(() => {
        container.clearInstances();
        vi.clearAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(1234567890);
        factory = createSpyObj<EndpointScanFactory>(['create']);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'warning', 'error']));
        container.registerInstance(AAS_INDEX, createSpyObj<AASIndexClient>([]));
        container.registerInstance(EndpointScanFactory, factory);
        container.registerSingleton(ScanApp, ScanApp);
    });

    it('posts update events with active scan metadata', async () => {
        const scanner = new EventEmitter() as EventEmitter & Pick<EndpointScan, 'scan' | 'destroy'>;
        scanner.scan = vi.fn(async () => {
            scanner.emit('update', document);
        });

        scanner.destroy = vi.fn();
        factory.create.mockReturnValue(scanner as EndpointScan);
        container.resolve(ScanApp);

        const handler = parentPort.on.mock.calls.find(([event]) => event === 'message')?.[1] as (
            data: unknown,
        ) => Promise<void>;
        await handler({
            type: 'command',
            name: 'ScanEndpoint',
            args: { taskId: 42, endpoint },
        });

        expect(parentPort.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Updated',
                args: { taskId: 42, endpoint: endpoint.name, document, start: 1234567890 },
            }),
        );
    });
});

const endpoint = {
    name: 'Test endpoint',
    type: 'AAS_API',
    url: 'https://example.com',
    version: '3.0',
} as AASEndpoint;

const document = {
    id: 'urn:test:document',
    idShort: 'TestDocument',
    address: 'https://example.com/shells/test',
    endpoint: endpoint.name,
    timestamp: 0,
} as AASDocument;
