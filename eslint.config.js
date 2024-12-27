import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/explicit-member-accessibility': 'error',
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    eslintPluginPrettierRecommended,
];
