/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import os from 'os';
import fs from 'fs';
import path from 'path';
import { describe, beforeEach, it, expect } from '@jest/globals';
import { aas, jsonization, types } from 'aas-core';

import { AasxPackage } from '../app/aasx-package.js';

describe('AASXPackage', () => {
    let aasx: AasxPackage;

    beforeEach(async () => {
        const tmpDir = os.tmpdir();
        const aasxFile = path.join(tmpDir, 'example-motor.aasx');
        await fs.promises.copyFile('./src/test/assets/example-motor.aasx', aasxFile);
        aasx = new AasxPackage(aasxFile);
    });

    describe('getEnvironment', () => {
        it('reads the environment', async () => {
            const env = await aasx.getEnvironment();
            expect(env).toBeDefined();
        });
    });

    describe('setEnvironment', () => {
        let env: types.Environment;

        beforeEach(() => {
            env = jsonization.environmentFromJsonable({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } satisfies aas.Environment).mustValue();
        });

        it('sets or updates the environment', async () => {
            await aasx.setEnvironment(env);
            expect(await aasx.getEnvironment()).toEqual({
                assetAdministrationShells: [],
                submodels: [],
                conceptDescriptions: [],
            } satisfies aas.Environment);
        });
    });

    describe('getThumbnail', () => {
        it('gets the thumbnail', async () => {
            const thumbnail = await aasx.getThumbnail();
            expect(thumbnail?.filename).toEqual('MotorI40.JPG');
        });
    });

    describe('setThumbnail', () => {
        it('sets or updates a thumbnail', async () => {
            const thumbnail = fs.createReadStream('./src/test/assets/thumbnail.png');
            await aasx.setThumbnail('/assets/thumbnail.png', thumbnail);
            expect((await aasx.getThumbnail())?.filename).toEqual('thumbnail.png');
        });
    });

    describe('removeThumbnail', () => {
        it('removes the thumbnail', async () => {
            await aasx.removeThumbnail();
            expect((await aasx.zip).file('MotorI40.JPG')).toBeFalsy();
        });
    });

    describe('read', () => {
        beforeEach(async () => {
            await aasx.write('assets/thumbnail.png', fs.createReadStream('./src/test/assets/thumbnail.png'));
        });

        it('returns a readable stream', async () => {
            const stream = await aasx.read('assets/thumbnail.png');
            expect(stream).toBeDefined();
        });

        it('throws an Error if file does not exist', async () => {
            await expect(() => aasx.read('unknown')).rejects.toThrow();
        });
    });

    describe('write', () => {
        it('inserts or updates a file', async () => {
            expect((await aasx.zip).file('assets/thumbnail.png')).toBeFalsy();
            await aasx.write('assets/thumbnail.png', fs.createReadStream('./src/test/assets/thumbnail.png'));
            expect((await aasx.zip).file('assets/thumbnail.png')).toBeTruthy();
        });
    });

    describe('remove', () => {
        beforeEach(async () => {
            await aasx.write('assets/thumbnail.png', fs.createReadStream('./src/test/assets/thumbnail.png'));
        });

        it('removes a file', async () => {
            expect((await aasx.zip).file('assets/thumbnail.png')).toBeTruthy();
            await aasx.remove('assets/thumbnail.png');
            expect((await aasx.zip).file('assets/thumbnail.png')).toBeFalsy();
        });
    });

    describe('save', () => {
        it('saves the content to a file', async () => {
            await aasx.write('assets/thumbnail.png', fs.createReadStream('./src/test/assets/thumbnail.png'));
            await expect(aasx.save()).resolves.toBe(void 0);
        });
    });
});
