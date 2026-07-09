/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { Logger } from 'aas-package';

import { KeywordDirectory } from './keyword-directory.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';

describe('KeywordDirectory', () => {
    let keywords: KeywordDirectory;
    let logger: Mocked<Logger>;
    let variable: Mocked<Variable>;

    beforeEach(async () => {
        variable = createSpyObj<Variable>({}, { ASSETS: fileURLToPath(new URL('../../test/assets', import.meta.url)) });
        logger = createSpyObj<Logger>(['error', 'info']);
        keywords = new KeywordDirectory(variable, logger);
        await keywords.wait;
    });

    it('should be created', function () {
        expect(keywords).toBeTruthy();
    });

    describe('containedKeyword', () => {
        it('returns AAS and Submodel', () => {
            expect(keywords.containedKeyword('This is an AAS with many submodels')).toEqual(['aas', 'submodel']);
        });
    });

    describe('toString', () => {
        it('', () => {
            const actual = keywords.toString(
                ['keyword1', 'keyword2', 'keyword3', 'keyword4', 'keyword5', 'keyword6', 'keyword7', 'keyword8'],
                ';',
                64,
            );

            expect(actual).toEqual('keyword1;keyword2;keyword3;keyword4;keyword5;keyword6;keyword7');
            expect(actual.length).toBeLessThanOrEqual(64);
        });
    });
});
