import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/lib/**/*.ts'],
            exclude: ['src/lib/aas-core/**.*'],
            reportsDirectory: '../../coverage/aas-core',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.ts'],
        outputFile: '../../coverage/aas-core.xml',
        reporters: ['default', 'junit'],
    },
});
