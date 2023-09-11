export default {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/lib/**/*.ts'
    ],
    coverageDirectory: '<rootDir>/../../reports/common',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    preset: 'ts-jest/presets/default-esm',
    rootDir: '.',
    roots: ['<rootDir>/src/'],
    testEnvironment: 'node',
    testMatch: [
        '**/?(*.)+(spec|test).[tj]s?(x)'
    ],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true
            }
        ]
    }
};
