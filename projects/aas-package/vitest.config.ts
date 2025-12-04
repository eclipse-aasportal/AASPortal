import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/lib/**/*.ts'],
            reportsDirectory: '../../reports/aas-package',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        outputFile: '../../reports/aas-package.xml',
        reporters: ['default', 'junit'],
    },
});
