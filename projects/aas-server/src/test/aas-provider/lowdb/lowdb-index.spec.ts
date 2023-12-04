/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { Low } from 'lowdb';
import { createSpyObj } from '../../utils.js';
import { AASCursor, AASDocument, AASDocumentId } from 'common';
import { Variable } from '../../../app/variable.js';
import { LowDbIndex } from '../../../app/aas-provider/lowdb/lowdb-index.js';
import { LowDbData } from '../../../app/aas-provider/lowdb/lowdb-types.js';
import { dbData } from '../../assets/test-db.js';

describe('LowDbIndex', () => {
    let index: LowDbIndex;
    let db: jest.Mocked<Low<LowDbData>>;
    let variable: jest.Mocked<Variable>;

    function getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    beforeEach(() => {
        db = createSpyObj<Low<LowDbData>>(['read', 'write'], { data: dbData });
        db.read.mockResolvedValue();
        variable = createSpyObj<Variable>([], { ENDPOINTS: [] });
        index = new LowDbIndex(db, variable);
    });

    it('should create', () => {
        expect(index).toBeTruthy();
    });

    describe('getContainerDocuments', () => {
        it('returns all documents that belongs to a container', async () => {
            const array = await index.getContainerDocuments('Samples');
            expect(array).toEqual(db.data.documents.filter(document => document.endpoint === 'Samples'));
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