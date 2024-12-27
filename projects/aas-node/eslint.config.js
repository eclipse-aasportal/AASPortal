import globals from 'globals';
import tsParser from '@typescript-eslint/parser'
import defaultConfig from '../../eslint.config.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
    ...defaultConfig,
    {
        languageOptions: {
            globals: globals.node,
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        ignores: ['src/test/assets/**/*'],
    },
];
