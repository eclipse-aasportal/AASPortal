import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/lib/index.ts'],
    outfile: './dist/awp-jest.js',
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    tsconfig: 'tsconfig.lib.json',
    minify: true,
    external: ['lodash-es', 'reflect-metadata', '@jest/globals'],
});