import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app/**/*.ts'],
            reportsDirectory: '../../coverage/aas-server',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.ts'],
        outputFile: '../../coverage/aas-server.xml',
        reporters: ['default', 'junit'],
    },
});
