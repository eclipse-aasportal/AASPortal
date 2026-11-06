/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { DocumentCache } from './document-cache';
import { AASDocument } from 'aas-core';

describe('DocumentCache', () => {
    let cache: DocumentCache;

    beforeEach(() => {
        cache = new DocumentCache();
    });

    it('should create a cache', () => {
        expect(cache).toBeInstanceOf(DocumentCache);
    });

    it('should set and get a document', () => {
        const url = 'https://example.com/document/1';
        const document: AASDocument = {
            id: 'doc-1',
            idShort: 'Document 1',
            address: '',
            timestamp: 0,
            endpoint: '',
        };

        cache.set(url, document);
        const cachedDocument = cache.get(url);

        expect(cachedDocument).toEqual(document);
    });

    it('should return undefined for a non-existent document', () => {
        const url = 'https://example.com/document/2';
        const cachedDocument = cache.get(url);

        expect(cachedDocument).toBeUndefined();
    });

    it('should clear the cache', () => {
        const url = 'https://example.com/document/3';
        const document: AASDocument = {
            id: 'doc-3',
            idShort: 'Document 3',
            address: '',
            timestamp: 0,
            endpoint: '',
        };

        cache.set(url, document);
        cache.clear();
        const cachedDocument = cache.get(url);

        expect(cachedDocument).toBeUndefined();
    });
});
