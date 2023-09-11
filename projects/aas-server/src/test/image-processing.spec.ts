/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import Jimp from 'jimp';
import { ImageProcessing } from '../app/image-processing.js';
import { describe, it, expect } from '@jest/globals';

describe('image processing', function () {
    it('resizes an image to 128 x 128 pixels', async function () {
        const source = fs.createReadStream('./src/test/assets/thumbnail.jpg');
        const stream = await ImageProcessing.resizeAsync(source, 128, 128);
        expect(stream).toBeTruthy();
    });

    it('converts a tiff-image to a png-image', async function() {
        const source = fs.createReadStream('./src/test/assets/image.tiff');
        const stream = await ImageProcessing.convertAsync(source, Jimp.MIME_PNG);
        expect(stream).toBeTruthy();
    });
});