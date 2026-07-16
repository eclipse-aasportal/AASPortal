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

    // Prefer running the nyc JS directly with node if available. That avoids shell/.cmd issues on Windows.
    const nycJs = resolve(projectRoot, 'node_modules', 'nyc', 'bin', 'nyc.js');
    const useNodeRunner = existsSync(nycJs);

    const runNyc = (args: string[]): void => {
        if (useNodeRunner) {
            execFileSync(process.execPath, [nycJs, ...args], { stdio: 'inherit' });
        } else {
            const nycCmd = process.platform === 'win32' ? 'nyc.cmd' : 'nyc';
            const nycPath = resolve(projectRoot, 'node_modules', '.bin', nycCmd);
            const nycExecutable = existsSync(nycPath) ? nycPath : nycCmd;
            // Use a shell on Windows so .cmd shims execute correctly
            const options: Record<string, unknown> = { stdio: 'inherit' };
            if (process.platform === 'win32') options.shell = true;
            execFileSync(nycExecutable, args, options);
        }
    };

    runNyc(['merge', tempDir, mergedCoverageFile]);

    for (const entry of readdirSync(tempDir)) {
        if (entry !== 'coverage.json') {
            rmSync(resolve(tempDir, entry), { recursive: true, force: true });
        }
    }

    runNyc([
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
    ]);

    console.info(`Merged coverage report written to ${reportDir}`);
}

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path).toString()) as T;
}
