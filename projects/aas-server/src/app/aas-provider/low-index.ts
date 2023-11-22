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

    public override async getContainerDocuments(endpointName: string): Promise<AASDocument[]> {
        await this.promise;
        return this.db.data.documents.filter(document => document.endpoint === endpointName);
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

    public override async has(endpointName: string | undefined, id: string): Promise<boolean> {
        await this.promise;
        const document = endpointName
            ? this.db.data.documents.find(item => item.endpoint === endpointName && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        return document != null;
    }

    public async get(endpointName: string | undefined, id: string): Promise<AASDocument> {
        await this.promise;
        const document = endpointName
            ? this.db.data.documents.find(item => item.endpoint === endpointName && item.id === id)
            : this.db.data.documents.find(item => item.id === id);

        if (!document) {
            throw new Error(`An AAS with the identifier ${id} does not exist in ${endpointName}.`);
        }

        return document;
    }

    public override async add(document: AASDocument): Promise<void> {
        await this.promise;
        const endpoint = document.endpoint;
        const id = document.id;
        if (this.db.data.documents.some(item => item.endpoint === endpoint && item.id === id)) {
            throw new Error(`An AAS with the identifier ${id} already exist in ${endpoint}`);
        }

        const index = this.getInsertPosition(document);
        this.db.data.documents.splice(index, 0, document);
        await this.db.write();
    }

    public override async remove(endpointName: string, id: string): Promise<boolean> {
        await this.promise;
        const index = this.db.data.documents.findIndex(
            item => item.endpoint === endpointName && item.id === id);

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

    private getInsertPosition(document: AASDocumentId): number {
        let index = 0;
        for (const item of this.db.data.documents) {
            if (this.compare(item, document) > 0) {
                break;
            }

            ++index;
        }

        return index;
    }

    private async getFirstPage(limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        const n = limit + 1;
        for (const document of this.db.data.documents) {
            if (!filter || await filter.do(document)) {
                documents.push(document);
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            isFirst: true,
            documents: documents.slice(0, limit),
            isLast: documents.length < n
        };
    }

    private async getNextPage(previous: AASDocumentId, limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        const n = limit + 1;
        const items = this.db.data.documents;
        let i = items.findIndex(item => this.compare(previous, item) < 0);
        if ( i < 0) {
            return this.getLastPage(limit, filter);
        }

        for (let m = items.length; i < m; i++) {
            const document = items[i];
            if (!filter || await filter.do(document)) {
                documents.push(document);
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            isFirst: false,
            documents: documents.slice(0, limit),
            isLast: documents.length < n
        };
    }

    private async getPreviousPage(next: AASDocumentId, limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        const n = limit + 1
        const items = this.db.data.documents;
        let i = this.findIndexReverse(next);
        if (i < 0) {
            return this.getFirstPage(limit, filter);
        }

        for (; i >= 0; --i) {
            const document = items[i];
            if (!filter || await filter.do(document)) {
                documents.push(document);
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            isFirst: documents.length < n,
            documents: documents.slice(0, limit).reverse(),
            isLast: false
        };
    }

    private async getLastPage(limit: number, filter?: AASFilter): Promise<AASPage> {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { isFirst: true, documents, isLast: true };
        }

        const n = limit + 1
        const items = this.db.data.documents;
        for (let i = items.length - 1; i >= 0; --i) {
            const document = items[i];
            if (!filter || await filter.do(document)) {
                documents.push(document);
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            isFirst: documents.length < n,
            documents: documents.slice(0, limit).reverse(),
            isLast: true
        };
    }

    private findIndexReverse(next: AASDocumentId): number {
        const items = this.db.data.documents;
        for (let i = items.length - 1; i >= 0; --i) {
            if (this.compare(next, items[i]) > 0) {
                return i;
            }
        }

        return -1;
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