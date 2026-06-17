/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/lib/index.ts'],
    outfile: './dist/aas-package.js',
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'es2022',
    tsconfig: 'tsconfig.lib.json',
    packages: 'external',
    minify: false,
});
