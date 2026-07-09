/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';

import { Variable } from './variable.js';
import { createDatabase, createSpyObj } from '../test/mocks.js';
import { Discovery } from './discovery.js';

describe('Discovery', () => {
    let variable: Variable;

    beforeEach(() => {
        variable = createSpyObj<Variable>(
            {},
            { DATA: fileURLToPath(new URL('../test/assets/tmp/data', import.meta.url)), PAGE_SIZE: 100, CACHE_SIZE: 100 },
        );

    });

    describe('getAASIdsByAssetLink', () => {
        it('gets all concept descriptions', async () => {
            const db = await createDatabase();
            const discovery = new Discovery(db);
            const result = await discovery.getAASIdsByAssetLink(['http://customer.com/assets/KHBVZJSQKIY'], 100, undefined);
            expect(result.result).toEqual(['http://customer.com/aas/9175_7013_7091_9168']);
        });
    });
});