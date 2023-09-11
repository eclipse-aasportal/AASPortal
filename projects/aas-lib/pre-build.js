import { copyFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

main();

async function main() {
    await copyFile(resolve(__dirname, 'package.build.json'), resolve(__dirname, 'package.json'));
}