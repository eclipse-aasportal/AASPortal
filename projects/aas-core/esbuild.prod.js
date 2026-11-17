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
    outfile: './dist/aas-core.js',
    mainFields: ['module'],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    target: 'es2024',
    tsconfig: 'tsconfig.lib.json',
    external: ['lodash-es'],
    minify: true,
});
