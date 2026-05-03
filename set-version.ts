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

interface Package {
    name: string;
    version: string;
    description: string;
    author: string;
    homepage: string;
    license: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Offset for v3.6 */
const offset = 1560;

await main();

async function main(): Promise<void> {
    const packageFile = join(__dirname, 'package.json');
    let project: Package;
    try {
        project = await JSON.parse((await readFile(packageFile)).toString());
        if (await setVersion(project)) {
            await writeFile(packageFile, JSON.stringify(project, undefined, 4));
            console.info(`Version set to ${project.version}.`);
        }
    } catch (error) {
        console.error(error);
        return;
    }
}

async function setVersion(project: Package): Promise<boolean> {
    const arg = process.env.GITHUB_RUN_NUMBER || process.argv.at(2);
    const branch = process.env.GITHUB_REF_NAME || process.argv.at(3);

    if (!arg) {
        console.warn('GITHUB_RUN_NUMBER is not set. Version will not be updated.');
        return false;
    }

    const runNumber = parseInt(arg, 10);
    if (isNaN(runNumber)) {
        console.error(`Invalid GITHUB_RUN_NUMBER: ${arg}`);
        return false;
    }

    const [mayor, minor] = project.version.split('.').map(Number);
    const patch = runNumber - offset;
    let version = `${mayor}.${minor}.${patch}`;
    if (branch !== 'main') {
        version += branch === 'staging' ? '-rc' : '-dev';
    }

    project.version = version;
    return true;
}
