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
    ['@angular/animations', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/common', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/compiler', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/compiler-cli', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/core', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/elements', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/forms', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/localize', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/platform-browser', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/platform-browser-dynamic', 'node_modules/@angular/cli/LICENSE'],
    ['@angular/router', 'node_modules/@angular/cli/LICENSE'],
]);

const exclude = new Set(['aas-core', 'aas-lib', 'aas-portal', 'aas-node', 'aas-package']);

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
            const version = getRawVersion(project.dependencies[name]);
            await readLibraryAsync(name, version, libraries);
        }

        for (const name in project.devDependencies) {
            const version = getRawVersion(project.devDependencies[name]);
            await readLibraryAsync(name, version, libraries);
        }
    }

    libraries.sort((a, b) => a.name.localeCompare(b.name));

    return libraries;
}

function getRawVersion(value: string): string {
    const c = value.charAt(0);
    return c < '0' || c > '9' ? value.substring(1) : value;
}

async function readLibraryAsync(name: string, version: string, libraries: Library[]): Promise<void> {
    if (exclude.has(name)) {
        return;
    }

    const packageFile = join(nodeModulesFolder, name, 'package.json');
    if (existsSync(packageFile)) {
        try {
            const pkg = JSON.parse((await readFile(packageFile)).toString());
            libraries.push({
                name: pkg.name,
                version,
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
                    return (await readFile(join(file.parentPath, file.name))).toString();
                }
            }
        }
    }

    console.warn(`${packageName} has no license file.`);

    return '';
}
