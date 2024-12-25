/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
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
    target: 'es2022',
    tsconfig: 'tsconfig.app.json',
    packages: 'external',
    minify: false,
});

await esbuild.build({
    entryPoints: ['./src/app/aas-scan-worker.ts'],
    outdir: './dist',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    tsconfig: 'tsconfig.app.json',
    packages: 'external',
    minify: false,
});
