import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/lib/**/*.ts'],
            exclude: ['src/lib/aas-core/**.*'],
            reportsDirectory: './coverage',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
        outputFile: './coverage/coverage.xml',
        reporters: ['default', 'junit'],
    },
});
