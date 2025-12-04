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
import jszip from 'jszip';
import { describe, expect, beforeEach, it } from 'vitest';
import { fileURLToPath } from 'url';
import { AasxFile } from '../lib/aasx-file.js';

class AasxPackage extends AasxFile {
    private constructor(zip: jszip, file: string) {
        super(zip, file);
    }

    public async getThumbnail(): Promise<NodeJS.ReadableStream> {
        const result = await this.getPackageThumbnail();
        if (!result) {
            throw new Error('No thumbnail available.');
        }

        return result.readable;
    }

    public static async create(file: string): Promise<AasxPackage> {
        const zip = await AasxFile.createZip(file);
        return new AasxPackage(zip, file);
    }
}

describe('AASXPackage', () => {
    let aasx: AasxPackage;

    beforeEach(async () => {
        const tmpDir = os.tmpdir();
        const aasxFile = path.join(tmpDir, 'example-motor.aasx');
        const file = fileURLToPath(new URL('./assets/example-motor.aasx', import.meta.url));
        await fs.promises.copyFile(file, aasxFile);
        aasx = await AasxPackage.create(aasxFile);
    });

    describe('zip', () => {
        it('returns the zip archive', () => {
            expect(aasx.zip).toBeDefined();
        });
    });

    describe('getOriginName', () => {
        it('return the path to the AAS environment file', async () => {
            await expect(aasx.getOriginName()).resolves.toBe(
                'aasx/customer_com_aas_9175_7013_7091_9168/customer_com_aas_9175_7013_7091_9168.aas.xml',
            );
        });
    });

    describe('read', () => {
        it('read the environment file', async () => {
            const originName = await aasx.getOriginName();
            const readable = aasx.read(originName);
            expect(readable).toBeDefined();
        });
    });

    describe('write', () => {
        it('writes a file into the zip archive', async () => {
            const file = fileURLToPath(new URL('./assets/test.xml', import.meta.url));
            await aasx.write('files/test.xml', fs.createReadStream(file));
            expect(aasx.zip.filter(path => path === 'files/test.xml').length).toBe(1);
        });
    });

    describe('remove', () => {
        it('removes a file', async () => {
            const originName = await aasx.getOriginName();
            aasx.remove(originName);
            expect(aasx.zip.filter(path => path === originName).length).toBe(0);
        });

        describe('getThumbnailName', () => {
            it('returns the path of the thumbnail file', async () => {
                await expect(aasx.getThumbnailName()).resolves.toBe('MotorI40.JPG');
            });
        });

        describe('setThumbnail', () => {
            it('sets a new thumbnail image', async () => {
                const file = fileURLToPath(new URL('./assets/thumbnail.png', import.meta.url));
                await aasx.setThumbnail('new-thumbnail.png', fs.createReadStream(file));
                const thumbnailName = await aasx.getThumbnailName();
                expect(thumbnailName).toBe('new-thumbnail.png');
            });
        });

        describe('removeThumbnail', () => {
            it('removes the thumbnail image', async () => {
                await aasx.removeThumbnail();
                const thumbnailName = await aasx.getThumbnailName();
                expect(thumbnailName).toBeUndefined();
            });
        });
    });
});
