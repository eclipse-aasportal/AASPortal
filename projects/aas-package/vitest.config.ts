import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        coverage: {
            enabled: true,
            include: ['src/lib/**/*.ts'],
            reportsDirectory: '../../coverage/aas-package',
            reporter: ['text', 'json', 'html', 'clover', 'json-summary'],
        },
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
        outputFile: '../../coverage/aas-package.xml',
        reporters: ['default', 'junit'],
    },
});
