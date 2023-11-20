/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Low } from 'lowdb';
import { AASCursor, AASDocument, AASDocumentId, AASEndpoint, AASPage, ApplicationError } from 'common';
import { AASIndex } from './aas-index.js';
import { AASFilter } from './aas-filter.js';
import { Variable } from '../variable.js';
import { urlToEndpoint } from '../configuration.js';
import { ERRORS } from '../errors.js';

export interface Data {
    endpoints: AASEndpoint[];
    documents: AASDocument[];
}

export class LowIndex extends AASIndex {
    private readonly promise: Promise<void>;

    constructor(private readonly db: Low<Data>, private readonly variable: Variable) {
        super();

        this.promise = this.initialize();
    }

    public override async getEndpoints(): Promise<AASEndpoint[]> {
        await this.promise;
        return this.db.data.endpoints;
    }

    public override async getEndpoint(name: string): Promise<AASEndpoint> {
        await this.promise;
        const endpoint = this.db.data.endpoints.find(endpoint => endpoint.name === name);
        if (!endpoint) {
            throw new Error(`An endpoint with the name ${name} does not exist.`);
        }

        return endpoint;
    }

    public override async setEndpoint(endpoint: AASEndpoint): Promise<void> {
        await this.promise;
        if (this.db.data.endpoints.some(item => item.name === endpoint.name)) {
            throw new ApplicationError(
                `An endpoint with the name "${name}" already exists.`,
                ERRORS.RegistryAlreadyExists,
                endpoint.name);
        }

        this.db.data.endpoints.push(endpoint);
        await this.db.write();
    }

    public override async removeEndpoint(name: string): Promise<boolean> {
        await this.promise;
        const index = this.db.data.endpoints.findIndex(endpoint => endpoint.name === name);
        if (index < 0) return false;

        this.db.data.endpoints.splice(index, 1);
        await this.db.write();
        return true;
    }

    public override async getContainerDocuments(name: string): Promise<AASDocument[]> {
        await this.promise;
        return this.db.data.documents.filter(document => document.endpoint === name);
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
        const name = document.endpoint;
        const index = this.db.data.documents.findIndex(
            item => item.endpoint === name && item.id === document.id);

        if (index >= 0) {
            this.db.data.documents[index] = document;
            await this.db.write();
        }
    }

    public override async has(name: string | undefined, id: string): Promise<boolean> {
        await this.promise;
        const document = name
            ? this.db.data.documents.find(item => item.endpoint === name && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        return document != null;
    }

    public async get(name: string | undefined, id: string): Promise<AASDocument> {
        await this.promise;
        const document = name
            ? this.db.data.documents.find(item => item.endpoint === name && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        if (!document) {
            throw new Error(`An AAS with the identifier ${id} does not exist in ${name}.`);
        }

        return document;
    }

    public override async add(document: AASDocument): Promise<void> {
        await this.promise;
        const name = document.endpoint;
        const id = document.id;
        if (this.db.data.documents.some(item => item.endpoint === name && item.id === id)) {
            throw new Error(`An AAS with the identifier ${id} already exist in ${name}`);
        }

        this.db.data.documents.push({ ...document, content: null });
        await this.db.write();
    }

    public override async remove(name: string, id: string): Promise<boolean> {
        await this.promise;
        const index = this.db.data.documents.findIndex(
            item => item.endpoint === name && item.id === id);

        if (index < 0) return false;

        this.db.data.documents.splice(index, 1);
        await this.db.write();
        return true;
    }

    public async reset(): Promise<void> {
        this.db.data.documents = [];
        this.db.data.endpoints =
            this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint));

        await this.db.write();
    }

    private async initialize(): Promise<void> {
        await this.db.read();

        if (this.db.data.endpoints.length === 0) {
            const endpoints = this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint));
            this.db.data.endpoints.push(...endpoints);
            await this.db.write();
        }
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
        return { id: document.id, endpoint: document.endpoint };
    }

    private compare(a: AASDocumentId, b: AASDocumentId): number {
        if (a === b) {
            return 0;
        }

        const result = a.endpoint.localeCompare(b.endpoint);
        if (result !== 0) {
            return result;
        }

        return a.id.localeCompare(b.id);
    }
}