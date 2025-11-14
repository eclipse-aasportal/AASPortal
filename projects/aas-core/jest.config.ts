import type { Config } from 'jest';
import { createDefaultEsmPreset } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({
    tsconfig: './tsconfig.spec.json',
});

const config: Config = {
    ...presetConfig,
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/lib/**/*.ts'],
    coverageDirectory: '../../reports/aas-core',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    coverageProvider: 'v8',
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    reporters: ['default', ['jest-junit', { outputDirectory: '../../reports', outputName: 'aas-core.xml' }]],
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testEnvironment: 'node',
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
};

export default config;
