import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app'],
            reportsDirectory: '../../coverage/aas-node',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.ts'],
        outputFile: '../../coverage/aas-node.xml',
        reporters: ['default', 'junit'],
    },
});
