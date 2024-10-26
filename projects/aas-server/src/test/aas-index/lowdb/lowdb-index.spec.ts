/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeAll, beforeEach, describe, it, expect, jest } from '@jest/globals';
import path from 'path/posix';
import fs from 'fs';
import { Low } from 'lowdb';
import { AASCursor, AASDocument, AASDocumentId } from 'aas-core';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../../app/variable.js';
import { LowDbIndex } from '../../../app/aas-index/lowdb/lowdb-index.js';
import { LowDbData } from '../../../app/aas-index/lowdb/lowdb-types.js';
import { KeywordDirectory } from 'projects/aas-server/src/app/aas-index/keyword-directory.js';

describe('LowDbIndex', () => {
    let index: LowDbIndex;
    let db: jest.Mocked<Low<LowDbData>>;
    let variable: jest.Mocked<Variable>;
    let keywords: jest.Mocked<KeywordDirectory>;
    let dbData: LowDbData;

    beforeAll(async () => {
        const file = path.resolve('./', 'src/test/assets/test-db.json');
        dbData = JSON.parse((await fs.promises.readFile(file)).toString());
    });

    function getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    beforeEach(() => {
        db = createSpyObj<Low<LowDbData>>(['read', 'write'], { data: dbData });
        db.read.mockResolvedValue();
        variable = createSpyObj<Variable>([], { ENDPOINTS: [] });
        keywords = createSpyObj<KeywordDirectory>(['containedKeyword', 'toString']);
        index = new LowDbIndex(db, keywords, variable);
    });

    it('should create', () => {
        expect(index).toBeTruthy();
    });

    describe('getContainerDocuments', () => {
        it('returns all documents that belongs to a container', async () => {
            const result = await index.nextPage('Samples', undefined);
            expect(result.result).toEqual(db.data.documents.filter(document => document.endpoint === 'Samples'));
        });
    });

    describe('getDocuments', () => {
        it('provides all documents page by page (forward)', async () => {
            let cursor: AASCursor = { previous: null, limit: 5 };
            let page = await index.getDocuments(cursor);
            expect(page.previous).toBeNull();
            expect(page.next).toBeDefined();
            let n = page.documents.length;
            while (page.next !== null) {
                cursor = { ...cursor, next: getId(page.documents[page.documents.length - 1]) };
                page = await index.getDocuments(cursor);
                n += page.documents.length;
            }

            expect(page.previous).toBeDefined();
            expect(page.next).toBeNull();
            expect(n).toEqual(db.data.documents.length);
        });

        it('provides all documents page by page (reverse)', async () => {
            let cursor: AASCursor = { next: null, limit: 5 };
            let page = await index.getDocuments(cursor);
            expect(page.previous).toBeDefined();
            expect(page.next).toBeNull();
            let n = page.documents.length;
            while (page.previous !== null) {
                cursor = { ...cursor, previous: getId(page.documents[0]) };
                page = await index.getDocuments(cursor);
                n += page.documents.length;
            }

            expect(page.previous).toBeNull();
            expect(page.next).toBeDefined();
            expect(n).toEqual(db.data.documents.length);
        });
    });
});
