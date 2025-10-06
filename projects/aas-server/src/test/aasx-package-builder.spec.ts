/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { jsonization, types } from 'aas-core';

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AasxPackageBuilder } from '../app/aasx-package-builder.js';
import { Variable } from '../app/variable.js';
import { createSpyObj } from './create-spy-obj.js';

describe('AasxPackageBuilder', () => {
    let zipFile: string;
    let builder: AasxPackageBuilder;
    let variable: jest.Mocked<Variable>;

    beforeEach(async () => {
        zipFile = path.join(os.tmpdir(), 'test.aasx');
        if (fs.existsSync(zipFile)) {
            await fs.promises.unlink(zipFile);
        }

        variable = createSpyObj<Variable>([], { ASSETS: 'src/test/assets/' });
        builder = new AasxPackageBuilder(variable);
    });

    describe('create', () => {
        it('creates an initial .aasx file', async () => {
            const aasxPackage = await builder.create(zipFile);
            expect(aasxPackage).toBeTruthy();
            await expect(aasxPackage.getEnvironment()).resolves.toEqual(new types.Environment([], [], []));
        });

        it('creates an .aasx file from an AAS environment', async () => {
            const value: jsonization.JsonValue = JSON.parse((await fs.promises.readFile('src/test/assets/test.json')).toString());
            const result = jsonization.environmentFromJsonable(value);
            expect(result.error).toBeNull();
            const aasxPackage = await builder.create(zipFile, result.mustValue());
            const env = await aasxPackage.getEnvironment();
            expect(env.assetAdministrationShells?.length).toBe(1);
            expect(env.submodels?.length).toBe(4);
            expect(env.conceptDescriptions?.length).toBe(19);
        });
    });
});
