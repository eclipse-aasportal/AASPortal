import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app'],
            reportsDirectory: '../../reports/aas-node',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        outputFile: '../../reports/aas-node.xml',
        reporters: ['default', 'junit'],
    },
});
