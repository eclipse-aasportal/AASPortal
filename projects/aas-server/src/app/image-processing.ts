/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import jimp from 'jimp';
import { Duplex } from 'stream';

export class ImageProcessing {
    /**
     * Resizes an image.
     * @param source The source stream of the image.
     * @param width The new with of the image.
     * @param height The new height of the image.
     * @param  target The target stream.
     * @returns The resized image.
     */
    public static async resizeAsync(
        source: NodeJS.ReadableStream,
        width: number | undefined,
        height: number | undefined,
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

        const image = await jimp.read(buffer);
        await image.resize(width || jimp.AUTO, height || jimp.AUTO);
        const outBuffer = await image.getBufferAsync(jimp.MIME_PNG);

        const stream = new Duplex();
        stream.push(outBuffer);
        stream.push(null);
        return stream;
    }

    /**
     * Converts the specified source image to the specified mime-type.
     * @param source The source image.
     * @param mimeType The target mime-type.
     * @returns The converted image.
     */
    public static async convertAsync(source: NodeJS.ReadableStream, mimeType: string): Promise<NodeJS.ReadableStream> {
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

        const image = await jimp.read(buffer);
        const outBuffer = await image.getBufferAsync(mimeType);
        const stream = new Duplex();
        stream.push(outBuffer);
        stream.push(null);
        return stream;
    }
}