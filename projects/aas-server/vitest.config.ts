import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/app/**/*.ts'],
            reportsDirectory: '../../reports/aas-server',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        outputFile: '../../reports/aas-server.xml',
        reporters: ['default', 'junit'],
    },
});
