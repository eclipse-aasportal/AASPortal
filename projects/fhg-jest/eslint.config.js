import globals from 'globals';
import tsParser from '@typescript-eslint/parser'
import defaultConfig from '../../eslint.config.js';

export default [
    ...defaultConfig,
    {
        languageOptions: {
            globals: globals.es2022,
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
    },
];
