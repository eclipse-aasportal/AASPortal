/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';

import { createDatabase } from '../test/mocks.js';
import { Discovery } from './discovery.js';

describe('Discovery', () => {
    beforeEach(() => {});

    describe('getAASIdsByAssetLink', () => {
        it('gets all linked AAS IDs', async () => {
            const db = await createDatabase();
            const discovery = new Discovery(db);
            const result = await discovery.getAASIdsByAssetLink(
                ['http://customer.com/assets/KHBVZJSQKIY'],
                100,
                undefined,
            );

            expect(result.result).toEqual(['http://customer.com/aas/9175_7013_7091_9168']);
        });
    });
});
