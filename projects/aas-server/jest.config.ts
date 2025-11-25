import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({
    tsconfig: './tsconfig.spec.json',
});

const config: Config = {
    ...presetConfig,
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/app/**/*.ts'],
    coverageDirectory: '../../reports/aas-server',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    coverageProvider: 'v8',
    reporters: ['default', ['jest-junit', { outputDirectory: '../../reports', outputName: 'aas-server.xml' }]],
};

export default config;
