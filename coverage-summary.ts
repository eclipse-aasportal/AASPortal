/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { execFileSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'fs';
import { resolve } from 'path';

main();

function main(): void {
    const projectRoot = process.cwd();
    const packageJson = readJson<{ workspaces?: string[] }>(resolve(projectRoot, 'package.json'));
    const coverageFiles = (packageJson.workspaces ?? [])
        .map(workspace => resolve(projectRoot, workspace, 'coverage', 'coverage-final.json'))
        .filter(coverageFile => existsSync(coverageFile));

    if (coverageFiles.length === 0) {
        throw new Error('No workspace coverage-final.json files were found. Run the workspace tests first.');
    }

    const tempDir = resolve(projectRoot, '.nyc_output');
    const reportDir = resolve(projectRoot, 'coverage');
    const mergedCoverageFile = resolve(tempDir, 'coverage.json');

    rmSync(tempDir, { recursive: true, force: true });
    rmSync(reportDir, { recursive: true, force: true });
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(reportDir, { recursive: true });

    coverageFiles.forEach((coverageFile, index) => {
        copyFileSync(coverageFile, resolve(tempDir, `${index + 1}.json`));
    });

    execFileSync('nyc', ['merge', tempDir, mergedCoverageFile], { stdio: 'inherit' });

    for (const entry of readdirSync(tempDir)) {
        if (entry !== 'coverage.json') {
            rmSync(resolve(tempDir, entry), { recursive: true, force: true });
        }
    }

    execFileSync(
        'nyc',
        [
            'report',
            '--temp-dir',
            tempDir,
            '--report-dir',
            reportDir,
            '--reporter=text-summary',
            '--reporter=html',
            '--reporter=lcov',
            '--reporter=cobertura',
            '--reporter=json',
            '--reporter=json-summary',
        ],
        { stdio: 'inherit' },
    );

    console.info(`Merged coverage report written to ${reportDir}`);
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path).toString()) as T;
}
