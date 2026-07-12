import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app/**/*.ts'],
            reportsDirectory: './coverage',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/app/**/*.spec.ts'],
        outputFile: './coverage/coverage.xml',
        reporters: ['default', 'junit'],
    },
});
