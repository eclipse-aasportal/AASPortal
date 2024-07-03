/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/lib/index.ts'],
    outfile: './dist/aas-core.js',
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    target: 'es2022',
    tsconfig: 'tsconfig.lib.json',
    minify: true,
    external: ['lodash-es'],
});
