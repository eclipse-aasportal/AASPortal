import globals from 'globals';
import tsParser from '@typescript-eslint/parser'
import defaultConfig from '../../eslint.config.js';

export default [
    ...defaultConfig,
    {
        languageOptions: {
            globals: globals.browser,
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        ignores: ['src/test/assets/**/*'],
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
    }
];
