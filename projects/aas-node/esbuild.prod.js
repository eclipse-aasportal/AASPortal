/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/app/aas-node.ts'],
    outdir: './dist',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2024',
    tsconfig: 'tsconfig.app.json',
    packages: 'external',
    minify: true,
    preserveSymlinks: false,
});

await esbuild.build({
    entryPoints: ['./src/app/aas-scan.ts'],
    outdir: './dist',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2024',
    tsconfig: 'tsconfig.app.json',
    packages: 'external',
    minify: true,
    preserveSymlinks: false,
});

await esbuild.build({
    entryPoints: ['./src/app/aas-idx.ts'],
    outdir: './dist',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2024',
    tsconfig: 'tsconfig.app.json',
    packages: 'external',
    minify: true,
    preserveSymlinks: false,
});
