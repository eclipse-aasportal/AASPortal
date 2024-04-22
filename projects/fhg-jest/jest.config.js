export default {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/lib/**/*.ts'],
    coverageDirectory: '<rootDir>/../../reports/awp-jest',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    modulePaths: ['./'],
    preset: 'ts-jest/presets/default-esm',
    roots: ['<rootDir>'],
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
