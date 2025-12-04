import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/lib/**/*.ts'],
            exclude: ['src/lib/aas-core/**.*'],
            reportsDirectory: '../../reports/aas-core',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        outputFile: '../../reports/aas-core.xml',
        reporters: ['default', 'junit'],
    },
});
