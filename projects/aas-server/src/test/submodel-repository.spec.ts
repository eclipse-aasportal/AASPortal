/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { resolve } from 'path';

import { Variable } from '../app/variable.js';
import { SubmodelRepository } from '../app/submodel-repository.js';
import { HttpCache } from '../app/http-cache.js';
import { createDatabase, createSpyObj } from './mocks.js';
import { fileURLToPath } from 'url';

describe('SubmodelRepository', () => {
    let variable: Variable;
    let cache: HttpCache;

    beforeEach(() => {
        variable = createSpyObj<Variable>(
            {},
            { DATA: resolve('./src/test/assets/tmp/data'), PAGE_SIZE: 100, CACHE_SIZE: 100 },
        );

        cache = new HttpCache(variable);
    });

    describe('getSubmodels', () => {
        it('gets all submodels', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            const result = await repository.getSubmodels(undefined, undefined, 'deep', 'withoutBlobValue');
            expect(result.result.length).toBe(4);
        });
    });

    describe('getSubmodel', () => {
        it('gets a submodel', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            const submodel = await repository.getSubmodel(
                'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                'deep',
                'withoutBlobValue',
            );

            expect(submodel?.id).toEqual('http.//i40.customer.com/type/1/1/7A7104BDAB57E184');
        });

        it('throws an Error (unknown Submodel)', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(repository.getSubmodel('unknown', 'deep', 'withoutBlobValue')).rejects.toThrow();
        });
    });

    describe('getSubmodelElementAttachment', () => {
        it('download the file content', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            const result = await repository.getSubmodelElementAttachment(
                'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                'OperatingManual.DigitalFile_PDF',
            );

            expect(result.readable).toBeDefined();
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.getSubmodelElementAttachment('unknown', 'OperatingManual.DigitalFile_PDF'),
            ).rejects.toThrow();
        });
    });

    describe('updateSubmodelElementAttachment', () => {
        it('updates a File content', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.updateSubmodelElementAttachment(
                    'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    'OperatingManual.DigitalFile_PDF',
                    fileURLToPath(new URL('./assets/Test.pdf', import.meta.url)),
                    'Test.pdf',
                ),
            ).resolves.toBe(void 0);
        });

        it('throws an Error (unknown Submodel)', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.updateSubmodelElementAttachment(
                    'unknown',
                    'OperatingManual.DigitalFile_PDF',
                    resolve('./src/app/test/assets/Test.pdf'),
                    'Test.pdf',
                ),
            ).rejects.toThrow();
        });

        it('throws an Error (unknown File)', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.updateSubmodelElementAttachment(
                    'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    'OperatingManual.unknown',
                    resolve('./src/app/test/assets/Test.pdf'),
                    'Test.pdf',
                ),
            ).rejects.toThrow();
        });
    });

    describe('deleteSubmodelElementAttachment', () => {
        it('deletes a File content', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.deleteSubmodelElementAttachment(
                    'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    'OperatingManual.DigitalFile_PDF',
                ),
            ).resolves.toBe(void 0);
        });

        it('throws an Error', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.deleteSubmodelElementAttachment('unknown', 'OperatingManual.DigitalFile_PDF'),
            ).rejects.toThrow();
        });
    });

    describe('getSubmodelElement', () => {
        it('gets a Submodel Element', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            const property = await repository.getSubmodelElement(
                'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                'MaxRotationSpeed',
                'deep',
                'withoutBlobValue',
            );

            expect(property.modelType).toEqual('Property');
        });

        it('throws an Error (invalid idShortPath)', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.getSubmodelElement(
                    'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                    'unknown',
                    'deep',
                    'withoutBlobValue',
                ),
            ).rejects.toThrow();
        });
    });

    describe('getSubmodelElementValue', () => {
        it('gets a Submodel Element value', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            const value = await repository.getSubmodelElementValue(
                'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                'MaxRotationSpeed',
                'deep',
                'withoutBlobValue',
            );

            expect(value).toEqual(5000);
        });

        it('throws an error if idShortPath is invalid', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.getSubmodelElementValue(
                    'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                    'unknown',
                    'deep',
                    'withoutBlobValue',
                ),
            ).rejects.toThrowError();
        });
    });

    describe('patchSubmodelElementValue', () => {
        it('updates a Submodel Element value', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.patchSubmodelElementValue(
                    'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                    'MaxRotationSpeed',
                    6000,
                ),
            ).resolves.toBe(void 0);
        });

        it('throws an error if idShortPath is invalid', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.patchSubmodelElementValue(
                    'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                    'unknown',
                    6000,
                ),
            ).rejects.toThrowError();
        });

        it('throws an error if value is invalid', async () => {
            const db = await createDatabase();
            const repository = new SubmodelRepository(db, cache);
            await expect(
                repository.patchSubmodelElementValue(
                    'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                    'MaxRotationSpeed',
                    'invalid value',
                ),
            ).rejects.toThrowError();
        });
    });
});
