import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import defaultConfig from '../../eslint.config.js';

export default [
    ...defaultConfig,
    {
        ignores: ['src/test/assets/**'],
    },
    {
        languageOptions: {
            globals: globals.browser,
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'fhg',
                    style: 'camelCase',
                },
            ],

            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'fhg',
                    style: 'kebab-case',
                },
            ],
        },
    },
];
