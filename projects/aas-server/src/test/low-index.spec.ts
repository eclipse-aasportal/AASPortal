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
        return { id: document.id, url: document.container.split('?')[0] };
    }

    beforeEach(() => {
        db = createSpyObj<Low<Data>>(['read', 'write'], { data: data });
        db.read.mockResolvedValue();
        index = new LowIndex(db);
    });

    it('should create', () => {
        expect(index).toBeTruthy();
    });

    describe('getDocuments', () => {
        it('returns all documents that belongs to a container', async () => {
            const array = await index.getDocuments('file:///samples');
            expect(array.length).toBeGreaterThan(0);
        });
    });

    describe('getPage', () => {
        it('provides all documents page by page (forward)', async () => {
            let cursor: AASCursor = { previous: null, limit: 5 };
            let page = await index.getPage(cursor);
            expect(page.length).toBeGreaterThan(0);
            while (page.length > 0) {
                page = await index.getPage(cursor);
                expect(page.length).toBeGreaterThan(0);
                cursor = { ...cursor, next: getId(page[page.length - 1]) };
            }
        });

        it('provides all documents page by page (reverse)', async () => {
            let cursor: AASCursor = { next: null, limit: 5 };
            let page = await index.getPage(cursor);
            expect(page.length).toBeGreaterThan(0);
            while (page.length > 0) {
                page = await index.getPage(cursor);
                expect(page.length).toBeGreaterThan(0);
                cursor = { ...cursor, previous: getId(page[0]) };
            }
        });
    });
});