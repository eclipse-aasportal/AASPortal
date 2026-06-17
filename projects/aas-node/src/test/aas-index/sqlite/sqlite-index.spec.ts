/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { Logger } from 'aas-package';
import { KeywordDirectory } from '../../../app/index/keyword-directory.js';
import { SqliteIndex } from '../../../app/index/sqlite/sqlite-index.js';
import { createSpyObj } from '../../mocks.js';

describe('SqliteIndex', () => {
    let index: SqliteIndex;
    let logger: Mocked<Logger>;
    let keywords: Mocked<KeywordDirectory>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'info']);
        keywords = createSpyObj<KeywordDirectory>(['containedKeyword', 'toString']);
        index = new SqliteIndex(logger, keywords, ':memory:');
    });

    it('should be created', () => {
        expect(index).toBeTruthy();
    });
});