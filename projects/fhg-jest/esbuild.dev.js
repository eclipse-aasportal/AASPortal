import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/lib/index.ts'],
    outfile: './dist/fhg-jest.js',
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    tsconfig: 'tsconfig.lib.json',
    external: ['lodash-es', 'reflect-metadata', '@jest/globals'],
});
