import type { Config } from 'jest';

const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/lib/**/*.ts'],
    coverageDirectory: '../../reports/aas-core',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    coverageProvider: 'v8',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    preset: 'ts-jest/presets/default-esm',
    reporters: ['default', ['jest-junit', { outputDirectory: '../../reports', outputName: 'aas-core.xml' }]],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
};

export default config;
