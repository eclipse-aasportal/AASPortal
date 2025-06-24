import type { Config } from 'jest';

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/app/**/*.ts'],
    coverageDirectory: '../../reports/aas-node',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    coverageProvider: 'v8',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    preset: 'ts-jest/presets/default-esm',
    reporters: ['default', ['jest-junit', { outputDirectory: '../../reports', outputName: 'aas-node.xml' }]],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                babelConfig: {
                    plugins: ['@babel/plugin-syntax-import-attributes'],
                },
            },
        ],
    },
};

export default config;
