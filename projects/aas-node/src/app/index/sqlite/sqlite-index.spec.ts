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

    function createDocument(assetId: string = 'asset-1'): AASDocument {
        return {
            address: 'https://example.com/aas-1',
            endpoint: 'Endpoint 1',
            id: 'aas-1',
            idShort: 'AAS 1',
            assetId,
            thumbnail: null,
            timestamp: 1,
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

    function createDocumentWithId(id: string, endpoint: string = 'Endpoint 1'): AASDocument {
        return {
            ...createDocument(`asset-${id}`),
            endpoint,
            id,
            idShort: `AAS ${id}`,
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
        await index.insert(createDocumentWithId('aas-2'));
        await index.insert(createDocumentWithId('aas-1'));
        await index.insert(createDocumentWithId('aas-3', 'Endpoint 2'));

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
        await index.insert(createDocumentWithId('aas-1'));
        await index.insert(createDocumentWithId('aas-2', 'Endpoint 2'));
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
        await index.insert(createDocument());
        await index.update(createDocument('asset-2'));

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
});
