/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Low } from 'lowdb';
import { AASCursor, AASDocument, AASDocumentId, AASPage } from 'common';
import { AASIndex } from './aas-index.js';
import { AASFilter } from './aas-filter.js';

export interface Data {
    documents: AASDocument[];
}

export class LowIndex extends AASIndex {
    private readonly promise: Promise<void>;

    constructor(private readonly db: Low<Data>) {
        super();

        this.promise = db.read();
    }

    public override async getContainerDocuments(url: string): Promise<AASDocument[]> {
        await this.promise;
        return this.db.data.documents.filter(document => document.endpoint.url === url);
    }

    public override async getDocuments(cursor: AASCursor, filter?: AASFilter): Promise<AASPage> {
        await this.promise;

        if (cursor.next) {
            return await this.getNextPage(cursor.next, cursor.limit, filter);
        }

        if (cursor.previous) {
            return await this.getPreviousPage(cursor.previous, cursor.limit, filter);
        }

        if (cursor.previous === null) {
            return await this.getFirstPage(cursor.limit, filter);
        }

        return await this.getLastPage(cursor.limit, filter);
    }

    public override async set(document: AASDocument): Promise<void> {
        await this.promise;
        const url = document.endpoint.url;
        const index = this.db.data.documents.findIndex(
            item => item.endpoint.url === url && item.id === document.id);

        if (index >= 0) {
            this.db.data.documents[index] = document;
            await this.db.write();
        }
    }

    public override async has(url: string | undefined, id: string): Promise<boolean> {
        await this.promise;
        const document = url
            ? this.db.data.documents.find(item => item.endpoint.url === url && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        return document != null;
    }

    public async get(url: string | undefined, id: string): Promise<AASDocument> {
        await this.promise;
        const document = url
            ? this.db.data.documents.find(item => item.endpoint.url === url && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        if (!document) {
            throw new Error(`An AAS with the identifier ${id} does not exist in ${url}.`);
        }

        return document;
    }

    public override async add(document: AASDocument): Promise<void> {
        await this.promise;
        this.db.data.documents.push(document);
        await this.db.write();
    }

    public override async delete(url: string, id: string): Promise<void> {
        await this.promise;
        const index = this.db.data.documents.findIndex(
            item => item.endpoint.url === url && item.id === id);

        if (index >= 0) {
            this.db.data.documents.splice(index, 1);
            await this.db.write();
        }
    }

    public reset(): void {
        throw new Error('Not implemented.');
    }

    private async getFirstPage(limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min: AASDocumentId | undefined;
        let max: AASDocumentId | undefined;
        for (const document of this.db.data.documents) {
            if (!filter || await filter.do(document)) {
                const id = this.getId(document);
                let isGreater: boolean;
                if (!min || this.compare(id, min) < 0) {
                    min = id;
                    isGreater = true;
                } else {
                    isGreater = this.compare(min, id) <= 0;
                }

                if (isGreater) {
                    const index = documents.findIndex(item => this.compare(this.getId(item), id) > 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                        if (documents.length > limit) {
                            documents.splice(limit);
                        }
                    } else if (documents.length < limit) {
                        documents.push(document);
                    }
                }

                if (!max || this.compare(id, max) > 0) {
                    max = id;
                }
            }
        }

        return { isFirst: true, documents, isLast: this.isLastPage(documents, max) };
    }

    private async getNextPage(previous: AASDocumentId, limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min: AASDocumentId | undefined;
        let max: AASDocumentId | undefined;
        for (const document of this.db.data.documents) {
            if (!filter || await filter.do(document)) {
                const id = this.getId(document);
                if (this.compare(previous, id) < 0) {
                    const index = documents.findIndex(item => this.compare(this.getId(item), id) > 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                        if (documents.length > limit) {
                            documents.splice(limit);
                        }
                    } else if (documents.length < limit) {
                        documents.push(document);
                    }
                }

                if (!min || this.compare(id, min) < 0) {
                    min = id;
                } else if (!max || this.compare(id, max) > 0) {
                    max = id;
                }
            }
        }

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: this.isLastPage(documents, max) };
    }

    private async getPreviousPage(next: AASDocumentId, limit: number, filter?: AASFilter): Promise<AASPage> {
        let documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min: AASDocumentId | undefined;
        let max: AASDocumentId | undefined;
        for (const document of this.db.data.documents) {
            if (!filter || await filter.do(document)) {
                const id = this.getId(document);
                if (this.compare(next, id) > 0) {
                    const index = documents.findIndex(item => this.compare(this.getId(item), id) < 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                        if (documents.length > limit) {
                            documents.splice(limit);
                        }
                    } else if (documents.length < limit) {
                        documents.push(document);
                    }
                }

                if (!min || this.compare(id, min) < 0) {
                    min = id;
                } else if (!max || this.compare(id, max) > 0) {
                    max = id;
                }
            }
        }

        documents = documents.reverse();

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: this.isLastPage(documents, next) };
    }

    private async getLastPage(limit: number, filter?: AASFilter): Promise<AASPage> {
        let documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min: AASDocumentId | undefined;
        let max: AASDocumentId | undefined;
        for (const document of this.db.data.documents) {
            if (!filter || await filter.do(document)) {
                const id = this.getId(document);
                let isLower: boolean;
                if (!max || this.compare(id, max) > 0) {
                    max = id;
                    isLower = true;
                } else {
                    isLower = this.compare(max, id) >= 0;
                }

                if (isLower) {
                    const index = documents.findIndex(item => this.compare(this.getId(item), id) < 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                        if (documents.length > limit) {
                            documents.splice(limit);
                        }
                    } else if (documents.length < limit) {
                        documents.push(document);
                    }
                }

                if (!min || this.compare(id, min) < 0) {
                    min = id;
                }
            }
        }

        documents = documents.reverse();

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: true };
    }

    private isFirstPage(documents: AASDocument[], min: AASDocumentId | undefined): boolean {
        return documents.length === 0 || min == null || this.compare(min, this.getId(documents[0])) === 0;
    }

    private isLastPage(documents: AASDocument[], max: AASDocumentId | undefined): boolean {
        return documents.length === 0 || max == null ||
            this.compare(max, this.getId(documents[documents.length - 1])) === 0;
    }

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, url: document.endpoint.url };
    }

    private compare(a: AASDocumentId, b: AASDocumentId): number {
        if (a === b) {
            return 0;
        }

        const result = a.url.localeCompare(b.url);
        if (result !== 0) {
            return result;
        }

        return a.id.localeCompare(b.id);
    }
}