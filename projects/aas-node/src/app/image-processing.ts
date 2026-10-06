/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Jimp, ResizeStrategy } from 'jimp';
import { Duplex } from 'stream';

export class ImageProcessing {
    /**
     * Resizes an image.
     * @param source The source stream of the image.
     * @param width The new with of the image.
     * @param height The new height of the image.
     * @returns The resized image.
     */
    public static async resize(
        source: NodeJS.ReadableStream,
        options: { w: number; h?: number } | { w?: number; h: number },
    ): Promise<NodeJS.ReadableStream> {
        const buffer: Buffer = await new Promise((resolve, reject) => {
            const buffers: Uint8Array[] = [];
            source.on('data', function (buffer: Uint8Array) {
                buffers.push(buffer);
            });

            source.on('end', function () {
                try {
                    resolve(Buffer.concat(buffers));
                } catch (error) {
                    reject(error);
                }
            });

            source.resume();
        });

        const image = await Jimp.fromBuffer(buffer);
        await image.resize({ ...options, mode: ResizeStrategy.BICUBIC });
        const outBuffer = await image.getBuffer('image/png');
        const stream = new Duplex();
        stream.push(outBuffer);
        stream.push(null);
        return stream;
    }

    /**
     * Converts the specified source image to an PNG.
     * @param source The source image.
     * @returns The converted image.
     */
    public static async convert(source: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
        const buffer: Buffer = await new Promise((resolve, reject) => {
            const buffers: Uint8Array[] = [];
            source.on('data', function (buffer: Uint8Array) {
                buffers.push(buffer);
            });

            source.on('end', function () {
                try {
                    resolve(Buffer.concat(buffers));
                } catch (error) {
                    reject(error);
                }
            });

            source.resume();
        });

        const image = await Jimp.fromBuffer(buffer);
        const outBuffer = await image.getBuffer('image/png');
        const stream = new Duplex();
        stream.push(outBuffer);
        stream.push(null);
        return stream;
    }
}
