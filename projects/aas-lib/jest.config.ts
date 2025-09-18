import type { Config } from 'jest';
import { createEsmPreset } from 'jest-preset-angular/presets';
import { pathsToModuleNameMapper } from 'ts-jest';

import tsconfig from './tsconfig.json';

const esmPreset = createEsmPreset();

export default {
    ...esmPreset,
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        ...esmPreset.moduleNameMapper,
        ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>' }),
        '^rxjs': '<rootDir>/../../node_modules/rxjs/dist/bundles/rxjs.umd.js',
    },
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    transform: {
        '^.+\\.(ts|js|html|svg)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.(html|svg)$',
                useESM: true,
            },
        ],
    },
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/lib/**/*.ts'],
    coverageDirectory: '../../reports/aas-lib',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    coverageProvider: 'v8',
    reporters: ['default', ['jest-junit', { outputDirectory: '../../reports', outputName: 'aas-lib.xml' }]],
} satisfies Config;
