/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Low } from 'lowdb';
import { AASCursor, AASDocument, AASDocumentId } from 'common';
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

    public override async getDocuments(url: string): Promise<AASDocument[]> {
        await this.promise;
        return this.db.data.documents.filter(document => this.getKey(document.container) === url);
    }

    public override async getPage(cursor: AASCursor): Promise<AASDocument[]> {
        await this.promise;
        const documents: AASDocument[] = [];
        if (cursor.next) {
            return this.getNextPage(cursor.next);
        } else if (cursor.previous) {
            const a = cursor.previous;
            for (const document of this.db.data.documents) {
                const b = this.getId(document);
                if (this.compare(a, b) > 0) {
                    const index = documents.findIndex(item => this.compare(b, this.getId(item)) > 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                    } else {
                        documents.push(document);
                    }
                }
            }
        } else if (cursor.previous === null) {
            return this.getFirstPage();
        } else if (cursor.next === null) {
            const a = this.getMax();
            if (a) {
                for (const document of this.db.data.documents) {
                    const b = this.getId(document);
                    if (this.compare(a, b) >= 0) {
                        const index = documents.findIndex(item => this.compare(this.getId(item), b) > 0);
                        if (index >= 0) {
                            documents.splice(index, 0, document);
                        } else {
                            documents.push(document);
                        }
                    }
                }
            }
        }

        return documents.slice(0, cursor.limit);
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

    private getFirstPage(): AASDocument[] {
        const documents: AASDocument[] = [];
        const a = this.getMin();
        if (a) {
            for (const document of this.db.data.documents) {
                const b = this.getId(document);
                if (this.compare(a, b) <= 0) {
                    const index = documents.findIndex(item => this.compare(this.getId(item), b) > 0);
                    if (index >= 0) {
                        documents.splice(index, 0, document);
                    } else {
                        documents.push(document);
                    }
                }
            }
        }

        return documents;
    }

    private getNextPage(a: AASDocumentId): AASDocument[] {
        const documents: AASDocument[] = [];
        for (const document of this.db.data.documents) {
            const b = this.getId(document);
            if (this.compare(a, b) < 0) {
                const index = documents.findIndex(item => this.compare(this.getId(item), b) > 0);
                if (index >= 0) {
                    documents.splice(index, 0, document);
                } else {
                    documents.push(document);
                }
            }
        }

        return documents;
    }

    private getKey(url: string): string {
        return url.split('?')[0];
    }

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, url: document.container.split('?')[0] };
    }

    private getMin(): AASDocumentId | undefined {
        if (this.db.data.documents.length === 0) return undefined;

        let min: AASDocumentId = this.getId(this.db.data.documents[0]);
        this.db.data.documents.forEach(document => {
            const id = this.getId(document);
            if (this.compare(id, min) < 0) {
                min = id;
            }
        });

        return min;
    }

    private getMax(): AASDocumentId | undefined {
        if (this.db.data.documents.length === 0) return undefined;

        let max: AASDocumentId = this.getId(this.db.data.documents[0]);
        this.db.data.documents.forEach(document => {
            const id = this.getId(document);
            if (this.compare(id, max) > 0) {
                max = id;
            }
        });

        return max;
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