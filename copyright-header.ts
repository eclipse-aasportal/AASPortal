/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,",
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft",
 * zur Foerderung der angewandten Forschung e.V.",
 *
 *****************************************************************************/

import fs from 'fs';
import * as $path from 'path';
import readline from 'readline';
import os from 'os';

const jsHeader = [
    '/******************************************************************************',
    ' *',
    ' * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,',
    ' * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft',
    ' * zur Foerderung der angewandten Forschung e.V.',
    ' *',
    ' *****************************************************************************/',
    '',
];

const htmlHeader = [
    '<!-----------------------------------------------------------------------------',
    ' !',
    ' ! Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,',
    ' ! eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft',
    ' ! zur Foerderung der angewandten Forschung e.V.',
    ' !',
    ' !---------------------------------------------------------------------------->',
    '',
];

checkFilesAsync([
    './projects/aas-portal/src',
    './projects/aas-node/src',
    './projects/aas-lib/src',
    './projects/aas-core/src',
]);

async function checkFilesAsync(dirs: string[]): Promise<void> {
    const files: string[] = [];
    for (const dir of dirs) {
        await traverseFilesAsync(dir, ['.ts', '.js', '.html', '.css', '.scss'], files);
    }

    for (const file of files) {
        const extension = $path.extname(file).toLowerCase();
        const text = await readFileAsync(file);
        if (hasValidCopyrightHeader(text, extension)) {
            console.log(`${file}: header is Ok`);
        } else {
            const removed = removeCopyrightHeader(text, extension);
            insertCopyrightHeader(text, extension);
            await writeFileAsync(file, text);
            console.log(`${file}: ${removed ? 'header updated' : 'header inserted'}`);
        }
    }

    async function traverseFilesAsync(dir: string, extensions: string[], files: string[]): Promise<void> {
        const entries = await fs.promises.readdir(dir);
        for (const entry of entries) {
            const path = $path.join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isFile() && matchExtensions(path, extensions)) {
                files.push(path);
            } else if (stat.isDirectory()) {
                await traverseFilesAsync(path, extensions, files);
            }
        }
    }

    function matchExtensions(file: string, extensions: string[]): boolean {
        const extension = $path.extname(file).toLowerCase();
        return extensions.indexOf(extension) >= 0;
    }

    async function readFileAsync(path: string): Promise<string[]> {
        const text: string[] = [];
        return await new Promise((result, reject) => {
            const file = readline.createInterface({
                input: fs.createReadStream(path),
                output: process.stdout,
                terminal: false,
            });

            file.on('line', line => {
                text.push(line);
            });

            file.on('error', error => {
                reject(error);
            });

            file.on('close', () => {
                result(text);
            });
        });
    }

    /**
     * Determines wether the specified text has a valid copyright header.
     * @param {string[]} text The current text.
     * @param {string} extension The file type.
     * @returns `true` if the existing header is valid.
     */
    function hasValidCopyrightHeader(text: string[], extension: string): boolean {
        switch (extension) {
            case '.ts':
            case '.js':
            case '.css':
            case '.scss':
                return hasValidJsCopyrightHeader(text);
            case '.html':
                return hasValidHtmlCopyrightHeader(text);
            default:
                return true;
        }
    }

    /**
     * Determines wether the specified text has a valid copyright header.
     * @param {string[]} text The current text.
     * @returns `true` if the existing header is valid.
     */
    function hasValidJsCopyrightHeader(text: string[]): boolean {
        let result = Array.isArray(text) && text.length >= jsHeader.length;
        for (let i = 0; i < jsHeader.length; i++) {
            if (jsHeader[i] !== text[i]) {
                result = false;
                break;
            }
        }

        return result;
    }

    /**
     * Determines wether the specified text has a valid copyright header.
     * @param {string[]} text The current text.
     * @returns `true` if the existing header is valid.
     */
    function hasValidHtmlCopyrightHeader(text: string[]): boolean {
        let result = Array.isArray(text) && text.length >= htmlHeader.length;
        for (let i = 0; i < htmlHeader.length; i++) {
            if (htmlHeader[i] !== text[i]) {
                result = false;
                break;
            }
        }

        return result;
    }

    /**
     * Removes an existing header from the specified text.
     * @param {string} text The current text.
     * @returns `true` if an existing header has been removed.
     */
    function removeCopyrightHeader(text: string[], extension: string): boolean {
        switch (extension) {
            case '.ts':
            case '.js':
            case '.css':
            case '.scss':
                return removeJsCopyrightHeader(text);
            case '.html':
                return removeHtmlCopyrightHeader(text);
            default:
                return false;
        }
    }

    /**
     * Removes an existing header from the specified text.
     * @param {string} text The current text.
     * @returns `true` if an existing header has been removed.
     */
    function removeJsCopyrightHeader(text: string[]): boolean {
        let count = 0;
        let start = false;
        let end = false;
        for (let line of text) {
            line = line.trim();
            if (line.length === 0) {
                ++count;
            } else if (!start && !end && line.startsWith('/**********')) {
                ++count;
                start = true;
            } else if (start && !end && line.startsWith('*')) {
                ++count;
            } else if (start && !end && line.endsWith('**********/')) {
                ++count;
                end = true;
            } else {
                break;
            }
        }

        if (count > 0) {
            text.splice(0, count);
        }

        return count > 0;
    }

    /**
     * Removes an existing header from the specified text.
     * @param {string} text The current text.
     * @returns `true` if an existing header has been removed.
     */
    function removeHtmlCopyrightHeader(text: string[]): boolean {
        let count = 0;
        let start = false;
        let end = false;
        for (let line of text) {
            line = line.trim();
            if (line.length === 0) {
                ++count;
            } else if (!start && !end && line.startsWith('<!-------')) {
                ++count;
                start = true;
            } else if (start && !end && line.startsWith('!')) {
                ++count;
            } else if (start && !end && line.endsWith('--------->')) {
                ++count;
                end = true;
            } else {
                break;
            }
        }

        if (count > 0) {
            text.splice(0, count);
        }

        return count > 0;
    }

    /**
     * Inserts a copyright header.
     * @param {string[]} text The text.
     * @param {string} extension The file type.
     */
    function insertCopyrightHeader(text: string[], extension: string): void {
        switch (extension) {
            case '.ts':
            case '.js':
            case '.css':
            case '.scss':
                insertJsCopyrightHeader(text);
                break;
            case '.html':
                insertHtmlCopyrightHeader(text);
                break;
        }
    }

    /**
     * Inserts a copyright header.
     * @param {string[]} text The text.
     */
    function insertJsCopyrightHeader(text: string[]): void {
        for (let i = 0; i < jsHeader.length; i++) {
            text.splice(i, 0, jsHeader[i]);
        }
    }

    /**
     * Inserts a copyright header.
     * @param {string[]} text The text.
     */
    function insertHtmlCopyrightHeader(text: string[]): void {
        for (let i = 0; i < htmlHeader.length; i++) {
            text.splice(i, 0, htmlHeader[i]);
        }
    }

    /**
     * Write the text to the specified file.
     * @param {string} file The destination file.
     * @param {string[]} text The text;
     */
    async function writeFileAsync(file: string, text: string[]) {
        await fs.promises.writeFile(file, text.join(os.EOL));
    }
}
