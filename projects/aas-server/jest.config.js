export default {
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/app/**/*.ts'
    ],
    coverageDirectory: '<rootDir>/../../reports/aas-server',
    coverageReporters: ['html', 'json-summary', 'cobertura'],
    collectCoverageFrom: [
        "<rootDir>/src/app/**/*.[tj]s",
        "!<rootDir>/src/app/app.ts"
    ],
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
                useESM: true,
                babelConfig: {
                    plugins: [
                        "@babel/plugin-syntax-import-attributes"
                    ]
                }
            }
        ]
    }
};
