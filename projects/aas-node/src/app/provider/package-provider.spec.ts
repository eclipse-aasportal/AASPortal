/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked, vi, afterEach } from 'vitest';
import { container } from 'tsyringe';
import { PackageProvider } from './package-provider.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { createSpyObj } from '../../test/mocks.js';

describe('PackageProvider', () => {
    let provider: PackageProvider;
    let index: Mocked<AASIndex>;
    let clientFactory: Mocked<EndpointClientFactory>;

    beforeEach(() => {
        vi.useFakeTimers();
        index = createSpyObj<AASIndex>(['get', 'getEndpoint']);
        clientFactory = createSpyObj<EndpointClientFactory>(['create']);

        container.clearInstances();
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(EndpointClientFactory, clientFactory);
        container.registerSingleton(PackageProvider);
        provider = container.resolve(PackageProvider);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should be create', () => {
        expect(provider).toBeInstanceOf(PackageProvider);
    });
});
