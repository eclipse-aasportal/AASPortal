/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,",
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft",
 * zur Foerderung der angewandten Forschung e.V.",
 *
 *****************************************************************************/

import { readFile, writeFile, readdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
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

interface ApplicationInfo {
    name: string;
    version: string;
    description: string;
    author: string;
    homepage: string;
    license: string;
    libraries: Library[];
}

interface Library {
    name: string;
    version: string;
    description: string;
    license: string;
    licenseText: string;
    homepage: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const nodeModulesFolder = join(__dirname, 'node_modules');

const replacements = new Map<string, string>([
    ['@angular/animations', 'oss/@angular/LICENSE.txt'],
    ['@angular/common', 'oss/@angular/LICENSE.txt'],
    ['@angular/compiler', 'oss/@angular/LICENSE.txt'],
    ['@angular/compiler-cli', 'oss/@angular/LICENSE.txt'],
    ['@angular/core', 'oss/@angular/LICENSE.txt'],
    ['@angular/forms', 'oss/@angular/LICENSE.txt'],
    ['@angular/localize', 'oss/@angular/LICENSE.txt'],
    ['@angular/platform-browser', 'oss/@angular/LICENSE.txt'],
    ['@angular/platform-browser-dynamic', 'oss/@angular/LICENSE.txt'],
    ['@angular/router', 'oss/@angular/LICENSE.txt'],
    ['@ngx-translate/core', 'oss/@ngx-translate/core/LICENSE.txt'],
    ['@ngx-translate/http-loader', 'oss/@ngx-translate/http-loader/LICENSE.txt'],
]);

const exclude = new Set(['aas-core', 'aas-lib', 'aas-portal', 'aas-node', 'fhg-jest']);

await main();

async function main(): Promise<void> {
    const packageFile = join(__dirname, 'package.json');
    let project: Package;
    try {
        project = await JSON.parse((await readFile(packageFile)).toString());
        console.info(`File ${packageFile} read.`);
    } catch (error) {
        console.error(error);
        return;
    }

    const appInfo: ApplicationInfo = {
        name: project.name,
        version: project.version,
        description: project.description,
        author: project.author,
        homepage: project.homepage,
        license: project.license,
        libraries: await readLibrariesAsync(project),
    };

    const file = join(__dirname, 'projects/aas-node/src/assets/app-info.json');
    try {
        await writeFile(file, JSON.stringify(appInfo, undefined, 2));
        console.info(`File ${file} read.`);
    } catch (error) {
        console.error(error);
    }
}

async function readLibrariesAsync(project: Package): Promise<Library[]> {
    const libraries: Library[] = [];
    if (existsSync(nodeModulesFolder)) {
        for (const name in project.dependencies) {
            await readLibraryAsync(name, libraries);
        }

        for (const name in project.devDependencies) {
            await readLibraryAsync(name, libraries);
        }
    }

    libraries.sort((a, b) => a.name.localeCompare(b.name));

    return libraries;
}

async function readLibraryAsync(name: string, libraries: Library[]): Promise<void> {
    if (exclude.has(name)) {
        return;
    }

    const packageFile = join(nodeModulesFolder, name, 'package.json');
    if (existsSync(packageFile)) {
        try {
            const pkg = JSON.parse((await readFile(packageFile)).toString());
            libraries.push({
                name: pkg.name,
                version: pkg.version,
                description: pkg.description,
                license: pkg.license,
                licenseText: await loadLicenseText(nodeModulesFolder, name),
                homepage: pkg.homepage,
            });
        } catch (error) {
            console.error(error);
        }
    }
}

async function loadLicenseText(nodeModulesFolder: string, packageName: string): Promise<string> {
    const value = replacements.get(packageName);
    if (value) {
        return (await readFile(join(__dirname, value))).toString();
    } else {
        const folder = join(nodeModulesFolder, packageName);
        for (const file of await readdir(folder, { withFileTypes: true, recursive: true })) {
            if (file.isFile()) {
                if (path.basename(file.name, path.extname(file.name)).toLowerCase() === 'license') {
                    return (await readFile(join(file.path, file.name))).toString();
                }
            }
        }
    }

    console.warn(`${packageName} has no license file.`);

    return '';
}
