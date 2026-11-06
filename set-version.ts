/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,",
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft",
 * zur Foerderung der angewandten Forschung e.V.",
 *
 *****************************************************************************/

import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Offset for v3.9 */
const offset = 554;

await main();

async function main(): Promise<void> {
    try {
        const arg = process.env.GITHUB_RUN_NUMBER ?? process.argv.at(2);
        const branch = process.env.GITHUB_REF_NAME ?? process.argv.at(3);

        if (!arg) {
            console.error('GITHUB_RUN_NUMBER is not set. Version will not be updated.');
            process.exit(-1);
        }

        const runNumber = parseInt(arg, 10);
        if (isNaN(runNumber)) {
            console.error(`Invalid GITHUB_RUN_NUMBER: ${arg}`);
            process.exit(-1);
        }

        console.info(`Patch number build from GITHUB_RUN_NUMBER: ${runNumber}, GITHUB_REF_NAME: ${branch}`);

        const patch = runNumber - offset;
        await setVersion(join(__dirname, 'package.json'), patch, branch);
        await setVersion(join(__dirname, 'projects/aas-node/package.json'), patch, branch);
        await setVersion(join(__dirname, 'projects/aas-server/package.json'), patch, branch);
    } catch (error) {
        console.error(error);
        process.exit(-1);
    }
}

async function setVersion(file: string, patch: number, branch: string | undefined): Promise<void> {
    const project = await JSON.parse((await readFile(file)).toString());
    const [mayor, minor] = project.version.split('.').map(Number);
    let version = `${mayor}.${minor}.${patch}`;
    if (branch === 'development') {
        version += '-dev';
    } else if (branch === 'staging') {
        version += '-rc';
    }

    project.version = version;
    await writeFile(file, JSON.stringify(project, undefined, 4));
    console.info(`${file}: Version set to ${version}`);
}
