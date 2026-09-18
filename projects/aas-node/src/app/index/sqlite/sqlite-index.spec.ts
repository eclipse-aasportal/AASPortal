/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { AASDocument, AASEndpoint } from 'aas-core';
import { Logger } from 'aas-package';
import { KeywordDirectory } from '../keyword-directory.js';
import { SqliteIndex } from './sqlite-index.js';
import { createSpyObj } from '../../../test/mocks.js';

describe('SqliteIndex', () => {
    let index: SqliteIndex;
    let logger: Mocked<Logger>;
    let keywords: Mocked<KeywordDirectory>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'info']);
        keywords = createSpyObj<KeywordDirectory>(['containedKeyword', 'toString']);
        index = new SqliteIndex(logger, keywords, ':memory:');
    });

    function createDocument(index: number = 1, endpoint = 'Endpoint 1'): AASDocument {
        return {
            address: `https://example.com/aas-${index}`,
            endpoint,
            id: `aas-${index}`,
            idShort: `AAS ${index}`,
            assetId: `asset-${index}`,
            thumbnail: null,
            timestamp: index,
            content: null,
        };
    }

    function createEndpoint(name: string = 'Endpoint 1'): AASEndpoint {
        return {
            name,
            url: `https://example.com/${name}`,
            type: 'AAS_API',
        };
    }

    it('should be created', () => {
        expect(index).toBeTruthy();
    });

    it('stores, updates, and deletes endpoints', async () => {
        await index.insertEndpoint(createEndpoint());

        await expect(index.getEndpointCount()).resolves.toBe(1);
        await expect(index.findEndpoint('Endpoint 1')).resolves.toEqual(createEndpoint());

        const updatedEndpoint = { ...createEndpoint(), url: 'https://example.com/updated', version: '3.0' };
        await expect(index.updateEndpoint(updatedEndpoint)).resolves.toEqual(createEndpoint());
        await expect(index.getEndpoint('Endpoint 1')).resolves.toEqual(updatedEndpoint);

        await expect(index.deleteEndpoint('Endpoint 1')).resolves.toBe(true);
        await expect(index.findEndpoint('Endpoint 1')).resolves.toBeUndefined();
    });

    it('counts documents and returns endpoint pages in identifier order', async () => {
        await index.insert(createDocument(2));
        await index.insert(createDocument(1));
        await index.insert(createDocument(3, 'Endpoint 2'));

        await expect(index.getDocumentCount()).resolves.toBe(3);
        await expect(index.getDocumentCount('Endpoint 1')).resolves.toBe(2);
        await expect(index.getEndpointDocuments('Endpoint 1', undefined, 1)).resolves.toEqual({
            result: [expect.objectContaining({ id: 'aas-1' })],
            paging_metadata: { cursor: 'aas-2' },
        });

        await expect(index.getEndpointDocuments('Endpoint 1', 'aas-2', 1)).resolves.toEqual({
            result: [expect.objectContaining({ id: 'aas-2' })],
            paging_metadata: { cursor: undefined },
        });
    });

    it('deletes a document and reports when it is absent', async () => {
        await index.insert(createDocument());

        await expect(index.delete('Endpoint 1', 'aas-1')).resolves.toBe(true);
        await expect(index.find('Endpoint 1', 'AssetAdministrationShell', 'aas-1')).resolves.toBeUndefined();
        await expect(index.delete('Endpoint 1', 'aas-1')).resolves.toBe(false);
    });

    it('clears documents and concept descriptions for an endpoint', async () => {
        await index.insert(createDocument(1));
        await index.insert(createDocument(2, 'Endpoint 2'));
        await index.setSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1', ['concept-description-1']);

        await index.clear('Endpoint 1');

        await expect(index.getDocumentCount('Endpoint 1')).resolves.toBe(0);
        await expect(index.getDocumentCount('Endpoint 2')).resolves.toBe(1);
        await expect(index.getSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1')).resolves.toEqual([]);
    });

    it('commits a no-op document update', async () => {
        const document = createDocument();

        await index.update(document);

        await expect(index.insert(document)).resolves.toBeUndefined();
    });

    it('updates the indexed asset identifier', async () => {
        const doc = createDocument(1);
        await index.insert(doc);
        await index.update({ ...doc, assetId: 'asset-2' });

        await expect(index.find('Endpoint 1', 'Asset', 'asset-1')).resolves.toBeUndefined();
        await expect(index.find('Endpoint 1', 'Asset', 'asset-2')).resolves.toMatchObject({ id: 'aas-1' });
    });

    it('gets stored submodel concept-description identifiers', async () => {
        await index.setSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1', [
            'concept-description-1',
            'concept-description-2',
        ]);

        await expect(index.getSubmodelConceptDescriptionIds('Endpoint 1', 'submodel-1')).resolves.toEqual([
            'concept-description-1',
            'concept-description-2',
        ]);
    });

    describe('getDocuments forward', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 5; ++i) {
                await index.insert(createDocument(i, `Endpoint ${1}`));
            }

            for (let i = 6; i <= 10; ++i) {
                await index.insert(createDocument(i, `Endpoint ${2}`));
            }
        });

        it('returns all documents', async () => {
            const page1 = await index.getDocuments({ previous: null, limit: 4 });
            const page2 = await index.getDocuments({ limit: 4, next: page1.next });
            const page3 = await index.getDocuments({ limit: 4, next: page2.next });
            expect(page1.documents.map(item => item.id)).toEqual(['aas-1', 'aas-2', 'aas-3', 'aas-4']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-5', 'aas-10', 'aas-6', 'aas-7']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-8', 'aas-9']);
        });

        it('returns all documents overall endpoints', async () => {
            const page1 = await index.getDocuments({ previous: null, limit: 4 }, ['Endpoint 1', 'Endpoint 2']);
            const page2 = await index.getDocuments({ limit: 4, next: page1.next }, ['Endpoint 1', 'Endpoint 2']);
            const page3 = await index.getDocuments({ limit: 4, next: page2.next }, ['Endpoint 1', 'Endpoint 2']);
            expect(page1.documents.map(item => item.id)).toEqual(['aas-1', 'aas-2', 'aas-3', 'aas-4']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-5', 'aas-10', 'aas-6', 'aas-7']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-8', 'aas-9']);
        });

        it('returns all documents of Endpoint 1', async () => {
            const page1 = await index.getDocuments({ previous: null, limit: 2 }, ['Endpoint 1']);
            const page2 = await index.getDocuments({ limit: 2, next: page1.next }, ['Endpoint 1']);
            const page3 = await index.getDocuments({ limit: 2, next: page2.next }, ['Endpoint 1']);
            expect(page1.documents.map(item => item.id)).toEqual(['aas-1', 'aas-2']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-3', 'aas-4']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-5']);
        });
    });

    describe('getDocuments reward', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 5; ++i) {
                await index.insert(createDocument(i, `Endpoint ${1}`));
            }

            for (let i = 6; i <= 10; ++i) {
                await index.insert(createDocument(i, `Endpoint ${2}`));
            }
        });

        it('returns all documents', async () => {
            const page1 = await index.getDocuments({ limit: 4, next: null });
            const page2 = await index.getDocuments({ previous: page1.previous, limit: 4 });
            const page3 = await index.getDocuments({ previous: page2.previous, limit: 4 });
            expect(page1.documents.map(item => item.id)).toEqual(['aas-6', 'aas-7', 'aas-8', 'aas-9']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-3', 'aas-4', 'aas-5', 'aas-10']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-1', 'aas-2']);
        });

        it('returns all documents overall endpoints', async () => {
            const page1 = await index.getDocuments({ limit: 4, next: null }, ['Endpoint 1', 'Endpoint 2']);
            const page2 = await index.getDocuments({ previous: page1.previous, limit: 4 }, [
                'Endpoint 1',
                'Endpoint 2',
            ]);

            const page3 = await index.getDocuments({ previous: page2.previous, limit: 4 }, [
                'Endpoint 1',
                'Endpoint 2',
            ]);

            expect(page1.documents.map(item => item.id)).toEqual(['aas-6', 'aas-7', 'aas-8', 'aas-9']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-3', 'aas-4', 'aas-5', 'aas-10']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-1', 'aas-2']);
        });

        it('returns all documents of Endpoint 2', async () => {
            const page1 = await index.getDocuments({ limit: 2, next: null }, ['Endpoint 2']);
            const page2 = await index.getDocuments({ previous: page1.previous, limit: 2 }, ['Endpoint 2']);
            const page3 = await index.getDocuments({ previous: page2.previous, limit: 2 }, ['Endpoint 2']);
            expect(page1.documents.map(item => item.id)).toEqual(['aas-8', 'aas-9']);
            expect(page2.documents.map(item => item.id)).toEqual(['aas-6', 'aas-7']);
            expect(page3.documents.map(item => item.id)).toEqual(['aas-10']);
        });
    });
});
