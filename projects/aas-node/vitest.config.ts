import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app'],
            reportsDirectory: './coverage',
            reporter: ['text-summary', 'json'],
            exclude: ['src/app/aas-idx.ts', 'src/app/aas-node.ts', 'src/app/aas-scan.ts'],
        },
        environment: 'node',
        include: ['src/**/*.spec.ts'],
        outputFile: './coverage/coverage.xml',
        reporters: ['default', 'junit'],
    },
});
