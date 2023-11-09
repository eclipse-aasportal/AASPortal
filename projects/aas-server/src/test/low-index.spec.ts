/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, it, expect, jest } from '@jest/globals';
import { Low } from 'lowdb';
import { Data, LowIndex } from '../app/aas-provider/low-index.js';
import { createSpyObj } from './utils.js';
import { data } from './assets/test-db.js';
import { AASCursor, AASDocument, AASDocumentId } from 'common';

describe('LowIndex', () => {
    let index: LowIndex;
    let db: jest.Mocked<Low<Data>>;

    function getId(document: AASDocument): AASDocumentId {
        return { id: document.id, url: document.endpoint.url };
    }

    beforeEach(() => {
        db = createSpyObj<Low<Data>>(['read', 'write'], { data: data });
        db.read.mockResolvedValue();
        index = new LowIndex(db);
    });

    it('should create', () => {
        expect(index).toBeTruthy();
    });

    describe('getContainerDocuments', () => {
        it('returns all documents that belongs to a container', async () => {
            const array = await index.getContainerDocuments('file:///samples');
            expect(array.length).toEqual(data.documents.length);
        });
    });

    describe('getDocuments', () => {
        it('provides all documents page by page (forward)', async () => {
            let cursor: AASCursor = { previous: null, limit: 5 };
            let page = await index.getDocuments(cursor);
            expect(page.isFirst).toBeTruthy();
            expect(page.isLast).toBeFalsy();
            let n = page.documents.length;
            while (!page.isLast) {
                cursor = { ...cursor, next: getId(page.documents[page.documents.length - 1]) };
                page = await index.getDocuments(cursor);
                n += page.documents.length;
            }

            expect(page.isFirst).toBeFalsy();
            expect(page.isLast).toBeTruthy();
            expect(n).toEqual(data.documents.length);
        });

        it('provides all documents page by page (reverse)', async () => {
            let cursor: AASCursor = { next: null, limit: 5 };
            let page = await index.getDocuments(cursor);
            expect(page.isFirst).toBeFalsy();
            expect(page.isLast).toBeTruthy();
            let n = page.documents.length;
            while (!page.isFirst) {
                cursor = { ...cursor, previous: getId(page.documents[0]) };
                page = await index.getDocuments(cursor);
                n += page.documents.length;
            }

            expect(page.isFirst).toBeTruthy();
            expect(page.isLast).toBeFalsy();
            expect(n).toEqual(data.documents.length);
        });
    });
});