import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            'projects/aas-node/vitest.config.ts',
            'projects/aas-server/vitest.config.ts',
            'projects/aas-core/vitest.config.ts',
            'projects/aas-package/vitest.config.ts',
        ],
    },
});
