/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

import { aas } from 'aas-core';
import { Variable } from '../app/variable.js';
import { ShellRepository } from '../app/shell-repository.js';
import { AasxPackageBuilder } from '../app/aasx-package-builder.js';
import { createDatabase, createSpyObj } from './mocks.js';

describe('ShellRepository', () => {
    let variable: Variable;
    let packageBuilder: AasxPackageBuilder;

    beforeEach(() => {
        variable = createSpyObj<Variable>(
            {},
            {
                DATA: resolve(__dirname, './assets/tmp/data'),
                PAGE_SIZE: 100,
                CACHE_SIZE: 100,
                ASSETS: resolve(__dirname, './assets'),
            },
        );

        packageBuilder = new AasxPackageBuilder(variable);
    });

    describe('getShells', () => {
        it('returns all Shells', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const result = await repository.getShells();
            expect(result.result.length).toBe(1);
        });
    });

    describe('getShell', () => {
        it('returns a Shell', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const shell = await repository.getShell('http://customer.com/aas/9175_7013_7091_9168');
            expect(shell?.id).toBe('http://customer.com/aas/9175_7013_7091_9168');
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(repository.getShell('unknown')).rejects.toThrow();
        });
    });

    describe('getAssetInformation', () => {
        it('returns the Asset Information', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const assetInformation = await repository.getAssetInformation(
                'http://customer.com/aas/9175_7013_7091_9168',
            );

            expect(assetInformation?.assetKind).toEqual('Instance');
            expect(assetInformation?.globalAssetId).toEqual('http://customer.com/assets/KHBVZJSQKIY');
            expect(assetInformation?.defaultThumbnail).toEqual({
                path: '/MotorI40.JPG',
            });
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(repository.getAssetInformation('unkmown')).rejects.toThrow();
        });
    });

    describe('getThumbnail', () => {
        it('returns the thumbnail', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const thumbnail = await repository.getThumbnail('http://customer.com/aas/9175_7013_7091_9168');
            expect(thumbnail?.filename).toBe('MotorI40.JPG');
            expect(thumbnail?.readable).toBeDefined();
            expect(thumbnail?.contentType).toBe('image/jpeg');
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(repository.getThumbnail('unknown')).rejects.toThrow();
        });
    });

    describe('updateThumbnail', () => {
        it('updates a thumbnail', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(
                repository.updateThumbnail(
                    'http://customer.com/aas/9175_7013_7091_9168',
                    fileURLToPath(new URL('./assets/thumbnail.png', import.meta.url)),
                    'thumbnail.png',
                ),
            ).resolves.toBe(void 0);
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(
                repository.updateThumbnail(
                    'unknown',
                    fileURLToPath(new URL('./assets/thumbnail.png', import.meta.url)),
                    'thumbnail.png',
                ),
            ).rejects.toThrow();
        });
    });

    describe('deleteThumbnail', () => {
        it('deletes a thumbnail', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(repository.deleteThumbnail('http://customer.com/aas/9175_7013_7091_9168')).resolves.toBe(
                void 0,
            );
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            await expect(repository.deleteThumbnail('unknown')).rejects.toThrow();
        });
    });

    describe('addShell', () => {
        let shell: aas.AssetAdministrationShell;

        beforeEach(() => {
            shell = {
                modelType: 'AssetAdministrationShell',
                id: 'http://customer.com/aas/new_aas',
                idShort: 'NewAAS',
                assetInformation: {
                    assetKind: 'Instance',
                },
            };
        });

        it('adds an AAS and resolves with the added shell', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const result = await repository.addShell(shell);
            expect(result).toEqual(shell);
        });
    });

    describe('updateShell', () => {
        let shell: aas.AssetAdministrationShell;

        beforeEach(() => {
            shell = {
                modelType: 'AssetAdministrationShell',
                id: 'http://customer.com/aas/9175_7013_7091_9168',
                idShort: 'UpdatedIdShort',
                assetInformation: {
                    assetKind: 'Instance',
                    globalAssetId: 'http://customer.com/assets/UPDATED_KHBVZJSQKIY',
                },
            };
        });

        it('updates an AAS and resolves with the updated shell', async () => {
            const db = await createDatabase();
            const repository = new ShellRepository(variable, db, packageBuilder);
            const result = await repository.updateShell(shell);
            expect(result.administration).toEqual(shell.administration);
            expect(result.assetInformation).toEqual(shell.assetInformation);
        });
    });
});