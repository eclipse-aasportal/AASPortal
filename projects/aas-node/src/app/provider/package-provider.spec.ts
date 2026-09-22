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
import fs from 'fs';
import { Readable } from 'stream';
import { AASDocument, AASEndpoint } from 'aas-core';
import { PackageProvider } from './package-provider.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { createSpyObj } from '../../test/mocks.js';
import { EndpointClient } from '../client/endpoint-client.js';

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        promises: {
            rename: vi.fn(),
            unlink: vi.fn(),
        },
    },
}));

describe('PackageProvider', () => {
    let provider: PackageProvider;
    let index: Mocked<AASIndex>;
    let clientFactory: Mocked<EndpointClientFactory>;
    let client: Mocked<EndpointClient>;
    const endpoint: AASEndpoint = { name: 'Samples', url: 'file:///samples', type: 'FileSystem' };
    const document: AASDocument = {
        id: 'urn:test:aas',
        idShort: 'TestAAS',
        endpoint: endpoint.name,
        address: 'test.aasx',
        timestamp: 0,
    };

    const headers = { authorization: 'Bearer token' };

    beforeEach(() => {
        vi.useFakeTimers();
        index = createSpyObj<AASIndex>(['delete', 'get', 'getEndpoint', 'insert']);
        clientFactory = createSpyObj<EndpointClientFactory>(['create']);
        client = createSpyObj<EndpointClient>([
            'close',
            'deletePackage',
            'determineAddress',
            'getDocument',
            'getPackage',
            'insertPackage',
            'open',
        ]);

        clientFactory.create.mockReturnValue(client);

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

    describe('getPackage', () => {
        it('opens the endpoint client, returns its package stream, and closes it', async () => {
            const stream = Readable.from('package');
            index.getEndpoint.mockResolvedValue(endpoint);
            index.get.mockResolvedValue(document);
            client.getPackage.mockResolvedValue(stream);

            await expect(provider.getPackage(endpoint.name, document.id, headers)).resolves.toBe(stream);

            expect(clientFactory.create).toHaveBeenCalledWith(endpoint, headers);
            expect(client.open).toHaveBeenCalledOnce();
            expect(client.getPackage).toHaveBeenCalledWith(document.id, document.address);
            expect(client.close).toHaveBeenCalledOnce();
        });

        it('closes the client when downloading the package fails', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            index.get.mockResolvedValue(document);
            client.getPackage.mockRejectedValue(new Error('Download failed'));

            await expect(provider.getPackage(endpoint.name, document.id)).rejects.toThrow('Download failed');

            expect(client.close).toHaveBeenCalledOnce();
        });
    });

    describe('insertPackages', () => {
        const file = { path: '/tmp/upload-123', originalname: 'test.aasx' } as Express.Multer.File;
        const aasxFile = '/tmp/test.aasx';

        it('replaces an existing upload, inserts the package, and indexes its document', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.promises.unlink).mockResolvedValue();
            vi.mocked(fs.promises.rename).mockResolvedValue();
            client.determineAddress.mockResolvedValue(document.address);
            client.getDocument.mockResolvedValue(document);

            await expect(provider.insertPackages(endpoint.name, file, headers)).resolves.toBeUndefined();

            expect(clientFactory.create).toHaveBeenCalledWith(endpoint, headers);
            expect(client.open).toHaveBeenCalledOnce();
            expect(fs.promises.unlink).toHaveBeenCalledWith(aasxFile);
            expect(fs.promises.rename).toHaveBeenCalledWith(file.path, aasxFile);
            expect(client.insertPackage).toHaveBeenCalledWith(aasxFile);
            expect(client.determineAddress).toHaveBeenCalledWith(aasxFile);
            expect(client.getDocument).toHaveBeenCalledWith(document.address);
            expect(index.insert).toHaveBeenCalledWith(document);
            expect(client.close).toHaveBeenCalledOnce();
        });

        it('does not index a package when the client cannot determine its address', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            vi.mocked(fs.existsSync).mockReturnValue(false);
            vi.mocked(fs.promises.rename).mockResolvedValue();
            client.determineAddress.mockResolvedValue(undefined);

            await provider.insertPackages(endpoint.name, file);

            expect(fs.promises.unlink).not.toHaveBeenCalled();
            expect(client.getDocument).not.toHaveBeenCalled();
            expect(index.insert).not.toHaveBeenCalled();
            expect(client.close).toHaveBeenCalledOnce();
        });
    });

    describe('deletePackage', () => {
        it('deletes a known package from the endpoint and index', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            index.get.mockResolvedValue(document);

            await expect(provider.deletePackage(endpoint.name, document.id, headers)).resolves.toBeUndefined();

            expect(clientFactory.create).toHaveBeenCalledWith(endpoint, headers);
            expect(client.deletePackage).toHaveBeenCalledWith(document.id, document.address);
            expect(index.delete).toHaveBeenCalledWith(endpoint.name, document.id);
            expect(client.close).toHaveBeenCalledOnce();
        });

        it('does not create a client when the package is absent from the index', async () => {
            index.getEndpoint.mockResolvedValue(endpoint);
            index.get.mockResolvedValue(undefined as never);

            await provider.deletePackage(endpoint.name, document.id);

            expect(clientFactory.create).not.toHaveBeenCalled();
            expect(index.delete).not.toHaveBeenCalled();
        });
    });
});
