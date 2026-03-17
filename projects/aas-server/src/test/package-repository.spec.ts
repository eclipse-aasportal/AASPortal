/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { fileURLToPath } from 'url';

import { PackageRepository } from '../app/package-repository.js';
import { Variable } from '../app/variable.js';
import { Logger } from '../app/logging/logger.js';
import { createDatabase, createSpyObj } from './mocks.js';
import { AasxPackageBuilder } from '../app/aasx-package-builder.js';

const PACKAGE_ID = 'WYv7aQvE5fqNf6ERYmf8T';

describe('PackageRepository', () => {
    let logger: Mocked<Logger>;
    let variable: Variable;
    let aasxBuilder: AasxPackageBuilder;

    beforeEach(async () => {
        logger = createSpyObj<Logger>(['info', 'warning', 'error']);
        variable = createSpyObj<Variable>(
            {},
            {
                DATA: fileURLToPath(new URL('./assets/tmp/data', import.meta.url)),
                PAGE_SIZE: 100,
                CACHE_SIZE: 100,
                ASSETS: fileURLToPath(new URL('./assets', import.meta.url)),
            },
        );

        aasxBuilder = new AasxPackageBuilder(variable);
    });

    describe('add', () => {
        it('adds an aasx file', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            const path = fileURLToPath(new URL('./assets/mvp-dpp-1.0.0.aasx', import.meta.url));
            const packageId = await repository.add(path, 'mvp-dpp-1.0.0.aasx');
            expect(packageId).toBeTruthy();
        });
    });

    describe('delete', () => {
        it('deletes an aasx package', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            await expect(repository.delete(PACKAGE_ID)).resolves.toBe(void 0);
        });
    });

    describe('update', () => {
        it('updates an aasx file', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            const path = fileURLToPath(new URL('./assets/example-motor.aasx', import.meta.url));
            await expect(repository.update(PACKAGE_ID, path, 'example-motor.aasx')).resolves.toBe(void 0);
        });

        it('throws an error', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            const path = './src/test/assets/example-motor.aasx';
            await expect(repository.update('unknown', path, 'example-motor.aasx')).rejects.toThrow();
        });
    });

    describe('getPackages', () => {
        it('gets all packages', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            const result = await repository.getPackages();
            expect(result.result.length).toBe(1);
        });
    });

    describe('getPackage', () => {
        it('downloads a package', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            const result = await repository.getPackage(PACKAGE_ID);
            expect(result.filename).toEqual('Example_AAS_ServoDCMotor_21.aasx');
        });

        it('throws an error', async () => {
            const db = await createDatabase();
            const repository = new PackageRepository(logger, variable, db, aasxBuilder);
            await expect(repository.getPackage('unknown')).rejects.toThrow();
        });
    });
});
