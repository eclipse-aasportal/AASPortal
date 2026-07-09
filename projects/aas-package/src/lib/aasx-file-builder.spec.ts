/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import os from 'os';
import path from 'path';
import fs from 'fs';
import jszip from 'jszip';
import { describe, expect, beforeEach, it } from 'vitest';
import { fileURLToPath } from 'url';
import { AasxFileBuilder } from './aasx-file-builder.js';
import { AasxFile } from './aasx-file.js';

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

class AasxPackageBuilder extends AasxFileBuilder<AasxPackage> {
    protected override async create(file: string): Promise<AasxPackage> {
        return await AasxPackage.create(file);
    }
}

describe('AasxFileBuilder', () => {
    let zipFile: string;
    let builder: AasxPackageBuilder;

    beforeEach(async () => {
        zipFile = path.join(os.tmpdir(), 'test.aasx');
        if (fs.existsSync(zipFile)) {
            await fs.promises.unlink(zipFile);
        }

        builder = new AasxPackageBuilder(fileURLToPath(new URL('../test/assets/', import.meta.url)));
    });

    describe('build', () => {
        it('builds an AasxPackage file', async () => {
            const aasx = await builder.build(zipFile);
            expect(aasx).toBeInstanceOf(AasxPackage);
        });
    });
});
