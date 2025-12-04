/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';

import { Variable } from '../app/variable.js';
import { createDatabase } from './utilities.js';
import { ConceptDescriptionRepository } from '../app/concept-description-repository.js';
import { HttpCache } from '../app/http-cache.js';
import { createSpyObj } from './mocks.js';

describe('ConceptDescriptionRepository', () => {
    let variable: Variable;
    let cache: HttpCache;

    beforeEach(() => {
        variable = createSpyObj<Variable>(
            {},
            { DATA: fileURLToPath(new URL('./assets/tmp/data', import.meta.url)), PAGE_SIZE: 100, CACHE_SIZE: 100 },
        );

        cache = new HttpCache(variable);
    });

    describe('getConceptDescriptions', () => {
        it('gets all concept descriptions', async () => {
            const db = await createDatabase();
            const repository = new ConceptDescriptionRepository(variable, db, cache);
            const result = await repository.getConceptDescriptions();
            expect(result.result.length).toBe(19);
        });
    });

    describe('getConceptDescription', () => {
        it('gets a concept description', async () => {
            const db = await createDatabase();
            const repository = new ConceptDescriptionRepository(variable, db, cache);
            const cd = await repository.getConceptDescription(
                'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
            );

            expect(cd?.id).toEqual(
                'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
            );
        });

        it('throws an Error (unknown concept description)', async () => {
            const db = await createDatabase();
            const repository = new ConceptDescriptionRepository(variable, db, cache);
            await expect(repository.getConceptDescription('unknown')).rejects.toThrow();
        });
    });

    describe('deleteConceptDescription', () => {
        it('gets a concept description', async () => {
            const db = await createDatabase();
            const repository = new ConceptDescriptionRepository(variable, db, cache);
            await expect(
                repository.deleteConceptDescription(
                    'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
                ),
            ).resolves.toBe(void 0);
        });

        it('throws an Error (unknown concept description)', async () => {
            const db = await createDatabase();
            const repository = new ConceptDescriptionRepository(variable, db, cache);
            await expect(repository.deleteConceptDescription('unknown')).rejects.toThrow();
        });
    });
});
