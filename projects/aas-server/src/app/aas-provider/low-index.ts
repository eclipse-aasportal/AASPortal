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
        return this.db.data.documents.filter(document => this.getKey(document.container) === url);
    }

    public override async getDocuments(cursor: AASCursor, filter?: string): Promise<AASPage> {
        await this.promise;

        if (cursor.next) {
            return this.getNextPage(cursor.next, cursor.limit);
        }

        if (cursor.previous) {
            return this.getPreviousPage(cursor.previous, cursor.limit);
        }

        if (cursor.previous === null) {
            return this.getFirstPage(cursor.limit);
        }

        return this.getLastPage(cursor.limit);
    }

    public override async set(document: AASDocument): Promise<void> {
        await this.promise;
        const url = this.getKey(document.container);
        const index = this.db.data.documents.findIndex(
            item => this.getKey(item.container) === url && item.id === document.id);

        if (index >= 0) {
            this.db.data.documents[index] = document;
            await this.db.write();
        }
    }

    public override async has(url: string, id: string): Promise<boolean> {
        await this.promise;
        const document = this.db.data.documents.find(
            item => this.getKey(item.container) === url && item.id === id);

        return document != null;
    }

    public async get(url: string, id: string): Promise<AASDocument> {
        await this.promise;
        const document = this.db.data.documents.find(
            item => this.getKey(item.container) === url && item.id === id);

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
            item => this.getKey(item.container) === url && item.id === id);

        if (index >= 0) {
            this.db.data.documents.splice(index, 1);
            await this.db.write();
        }
    }

    public reset(): void {
        throw new Error('Not implemented.');
    }

    private getFirstPage(limit: number): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min = this.getId(this.db.data.documents[0]);
        let max = min;
        for (const document of this.db.data.documents) {
            const id = this.getId(document);
            let isGreater: boolean;
            if (this.compare(id, min) < 0) {
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

            if (this.compare(id, max) > 0) {
                max = id;
            }
        }

        return { isFirst: true, documents, isLast: this.isLastPage(documents, max) };
    }

    private getNextPage(previous: AASDocumentId, limit: number): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min = this.getId(this.db.data.documents[0]);
        let max = min;
        for (const document of this.db.data.documents) {
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

            if (this.compare(id, min) < 0) {
                min = id;
            }

            if (this.compare(id, max) > 0) {
                max = id;
            }
        }

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: this.isLastPage(documents, max) };
    }

    private getPreviousPage(next: AASDocumentId, limit: number): AASPage {
        let documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let min = this.getId(this.db.data.documents[0]);
        let max = min;
        for (const document of this.db.data.documents) {
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

            if (this.compare(id, min) < 0) {
                min = id;
            }

            if (this.compare(id, max) > 0) {
                max = id;
            }
        }

        documents = documents.reverse();

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: this.isLastPage(documents, next) };
    }

    private getLastPage(limit: number): AASPage {
        let documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        let max = this.getId(this.db.data.documents[0]);
        let min = max;
        for (const document of this.db.data.documents) {
            const id = this.getId(document);
            let isLower: boolean;
            if (this.compare(id, max) > 0) {
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
            
            if (this.compare(id, min) < 0) {
                min = id;
            }
        }

        documents = documents.reverse();

        return { isFirst: this.isFirstPage(documents, min), documents, isLast: true };
    }

    private isFirstPage(documents: AASDocument[], min: AASDocumentId): boolean {
        return documents.length === 0 || this.compare(min, this.getId(documents[0])) === 0;
    }

    private isLastPage(documents: AASDocument[], max: AASDocumentId): boolean {
        return documents.length === 0 || this.compare(max, this.getId(documents[documents.length - 1])) === 0;
    }

    private getKey(url: string): string {
        return url.split('?')[0];
    }

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, url: document.container.split('?')[0] };
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