import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

main();

async function main() {
    const project = await read(resolve(__dirname, 'package.json'));
    const file = resolve(__dirname, 'projects/aas-server/app-info.json');
    const appInfo = await read(file);
    for (const item in appInfo) {
        appInfo[item] = project[item];
    }

    appInfo.libraries = await readLibrariesAsync(project);

    await write(file, appInfo);
}

async function read(file) {
    return JSON.parse(await readFile(file));
}

async function write(file, data) {
    return writeFile(file, JSON.stringify(data));
}

async function readLibrariesAsync(project) {
    const libraries = [];
    let nodeModulesFolder = join(__dirname, 'node_modules');
    if (existsSync(nodeModulesFolder)) {
        for (const name in project.dependencies) {
            let packageFile = join(nodeModulesFolder, name, 'package.json');
            if (existsSync(packageFile)) {
                try {
                    const pkg = JSON.parse((await readFile(packageFile)).toString());
                    libraries.push({
                        name: pkg.name,
                        version: pkg.version,
                        description: pkg.description,
                        license: pkg.license,
                        homepage: pkg.homepage
                    });
                } catch (error) {
                    noop();
                }
            }
        }
    }

    return libraries;
}

