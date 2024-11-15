/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Low } from 'lowdb';
import { v4 } from 'uuid';
import {
    AASCursor,
    AASDocument,
    AASDocumentId,
    AASEndpoint,
    AASPagedResult,
    ApplicationError,
    BaseValueType,
    aas,
    flat,
    isIdentifiable,
} from 'aas-core';

import { AASIndex } from '../aas-index.js';
import { LowDbQuery } from './lowdb-query.js';
import { Variable } from '../../variable.js';
import { urlToEndpoint } from '../../configuration.js';
import { ERRORS } from '../../errors.js';
import { LowDbData, LowDbDocument, LowDbElement } from './lowdb-types.js';
import { decodeBase64Url, encodeBase64Url } from '../../convert.js';
import { PagedResult } from '../../types/paged-result.js';
import { KeywordDirectory } from '../keyword-directory.js';
import { Logger } from '../../logging/logger.js';

export class LowDbIndex extends AASIndex {
    private readonly promise: Promise<void>;

    public constructor(
        private readonly logger: Logger,
        private readonly variable: Variable,
        private readonly db: Low<LowDbData>,
        keywordDirectory: KeywordDirectory,
    ) {
        super(keywordDirectory);

        this.promise = this.initialize();
        this.promise.then(() => logger.info('Using internal AAS index.')).catch(error => logger.error(error));
    }

    public override async getCount(endpoint?: string): Promise<number> {
        await this.promise;
        if (endpoint === undefined) {
            return this.db.data.documents.length;
        }

        let count = 0;
        this.db.data.documents.forEach(item => {
            if (item.endpoint === endpoint) {
                ++count;
            }
        });

        return count;
    }

    public override async getEndpoints(): Promise<AASEndpoint[]> {
        await this.promise;
        return this.db.data.endpoints;
    }

    public override async getEndpointCount(): Promise<number> {
        await this.promise;
        return this.db.data.endpoints.length;
    }

    public override async getEndpoint(name: string): Promise<AASEndpoint> {
        await this.promise;
        const endpoint = this.db.data.endpoints.find(endpoint => endpoint.name === name);
        if (!endpoint) {
            throw new Error(`An endpoint with the name ${name} does not exist.`);
        }

        return endpoint;
    }

    public override async hasEndpoint(name: string): Promise<boolean> {
        await this.promise;
        return this.db.data.endpoints.find(endpoint => endpoint.name === name) !== undefined;
    }

    public override async addEndpoint(endpoint: AASEndpoint): Promise<void> {
        await this.promise;
        if (this.db.data.endpoints.some(item => item.name === endpoint.name)) {
            throw new ApplicationError(
                `An endpoint with the name "${name}" already exists.`,
                ERRORS.RegistryAlreadyExists,
                endpoint.name,
            );
        }

        this.db.data.endpoints.push(endpoint);
        await this.db.write();
    }

    public override async updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint> {
        await this.promise;
        const index = this.db.data.endpoints.findIndex(item => item.name === endpoint.name);
        if (index < 0) {
            throw new Error(`An endpoint with the name ${name} does not exist.`);
        }

        const old = this.db.data.endpoints[index];
        this.db.data.endpoints[index] = endpoint;
        await this.db.write();
        return old;
    }

    public override async removeEndpoint(endpointName: string): Promise<boolean> {
        await this.promise;
        const index = this.db.data.endpoints.findIndex(endpoint => endpoint.name === endpointName);
        if (index < 0) return false;

        this.db.data.endpoints.splice(index, 1);
        this.removeDocuments(endpointName);
        await this.db.write();
        return true;
    }

    public override async nextPage(
        endpointName: string,
        cursor: string | undefined,
        limit: number = 100,
    ): Promise<PagedResult<AASDocument>> {
        await this.promise;

        if (cursor) {
            cursor = decodeBase64Url(cursor);
        }

        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { result: documents, paging_metadata: {} };
        }

        const items = this.db.data.documents;
        const index = items.findIndex(item => {
            if (item.endpoint !== endpointName) {
                return false;
            }

            return cursor === undefined || cursor.localeCompare(item.id) <= 0;
        });

        if (index < 0) {
            return { result: documents, paging_metadata: {} };
        }

        const result: AASDocument[] = [];
        for (let i = 0, j = index, n = items.length; i < limit && j < n; i++, j++) {
            const item = items[j];
            if (item.endpoint !== endpointName) {
                break;
            }

            result.push(item);
        }

        const k = index + limit + 1;
        if (k >= items.length || items[k].endpoint !== endpointName) {
            return { result, paging_metadata: {} };
        }

        return { result, paging_metadata: { cursor: encodeBase64Url(items[k].id) } };
    }

    public override async getDocuments(
        cursor: AASCursor,
        expression?: string,
        language?: string,
    ): Promise<AASPagedResult> {
        await this.promise;

        let query: LowDbQuery | undefined;
        if (expression) {
            query = new LowDbQuery(expression, language ?? 'en');
        }

        if (cursor.next) {
            return this.getNextPage(cursor.next, cursor.limit, query);
        }

        if (cursor.previous) {
            return this.getPreviousPage(cursor.previous, cursor.limit, query);
        }

        if (cursor.previous === null) {
            return this.getFirstPage(cursor.limit, query);
        }

        return this.getLastPage(cursor.limit, query);
    }

    public override async update(document: AASDocument): Promise<void> {
        await this.promise;
        const name = document.endpoint;
        const documents = this.db.data.documents;
        const index = documents.findIndex(item => item.endpoint === name && item.id === document.id);

        if (index >= 0) {
            const documentId = documents[index].uuid;
            documents[index] = { ...document, uuid: documentId, content: null };
            this.db.data.elements = this.db.data.elements.filter(element => element.uuid !== documentId);
            if (document.content) {
                this.traverseEnvironment(documentId, document.content);
            }

            await this.db.write();
        }
    }

    public async find(endpointName: string | undefined, id: string): Promise<AASDocument | undefined> {
        await this.promise;
        const document = endpointName
            ? this.db.data.documents.find(
                  item => item.endpoint === endpointName && (item.id === id || item.assetId === id),
              )
            : this.db.data.documents.find(item => item.id === id || item.assetId === id);

        if (document) {
            return this.toDocument(document);
        }

        return undefined;
    }

    public override async add(document: AASDocument): Promise<void> {
        await this.promise;
        const endpoint = document.endpoint;
        const id = document.id;
        const documents = this.db.data.documents;
        if (documents.some(item => item.endpoint === endpoint && item.id === id)) {
            throw new Error(`An AAS with the identifier ${id} already exist in ${endpoint}`);
        }

        const index = this.getInsertPosition(document);
        const uuid = v4();
        documents.splice(index, 0, { ...document, uuid, content: null });

        if (document.content) {
            this.traverseEnvironment(uuid, document.content);
        }

        await this.db.write();
    }

    public override async remove(endpointName: string, id: string): Promise<boolean> {
        await this.promise;
        const documents = this.db.data.documents;
        const index = documents.findIndex(item => item.endpoint === endpointName && item.id === id);
        if (index < 0) return false;

        const documentId = documents[index].uuid;
        this.db.data.elements = this.db.data.elements.filter(element => element.uuid !== documentId);

        documents.splice(index, 1);
        await this.db.write();
        return true;
    }

    public override async clear(): Promise<void> {
        this.db.data.documents = [];
        this.db.data.elements = [];
        this.db.data.endpoints = [];
        await this.db.write();
    }

    public override async reset(): Promise<void> {
        this.db.data.endpoints = this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint));
        await this.db.write();
    }

    private removeDocuments(endpoint: string) {
        const documents = this.db.data.documents.filter(document => document.endpoint === endpoint);
        this.db.data.documents = this.db.data.documents.filter(document => document.endpoint !== endpoint);
        for (const document of documents) {
            this.db.data.elements = this.db.data.elements.filter(element => element.uuid !== document.uuid);
        }
    }

    private toDocument(item: LowDbDocument): AASDocument {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { uuid, ...document } = item;
        return document;
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

    private getFirstPage(limit: number, filter?: LowDbQuery): AASPagedResult {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null };
        }

        const n = limit + 1;
        const elements = this.db.data.elements;
        for (const document of this.db.data.documents) {
            const uuid = document.uuid;
            if (
                !filter ||
                filter.do(
                    document,
                    elements.filter(element => element.uuid === uuid),
                )
            ) {
                documents.push(this.toDocument(document));
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            previous: null,
            documents: documents.slice(0, limit),
            next: documents.length >= 0 ? documents[limit] : null,
        };
    }

    private getNextPage(current: AASDocumentId, limit: number, filter?: LowDbQuery): AASPagedResult {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null };
        }

        const n = limit + 1;
        const items = this.db.data.documents;
        let i = items.findIndex(item => this.compare(current, item) < 0);
        if (i < 0) {
            return this.getLastPage(limit, filter);
        }

        const elements = this.db.data.elements;
        for (let m = items.length; i < m; i++) {
            const document = items[i];
            const uuid = document.uuid;
            if (
                !filter ||
                filter.do(
                    document,
                    elements.filter(element => element.uuid === uuid),
                )
            ) {
                documents.push(this.toDocument(document));
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            previous: current,
            documents: documents.slice(0, limit),
            next: documents.length >= n ? documents[limit] : null,
        };
    }

    private getPreviousPage(current: AASDocumentId, limit: number, filter?: LowDbQuery): AASPagedResult {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null };
        }

        const n = limit + 1;
        const items = this.db.data.documents;
        let i = this.findIndexReverse(current);
        if (i < 0) {
            return this.getFirstPage(limit, filter);
        }

        const elements = this.db.data.elements;
        for (; i >= 0; --i) {
            const document = items[i];
            const uuid = document.uuid;
            if (
                !filter ||
                filter.do(
                    document,
                    elements.filter(element => element.uuid === uuid),
                )
            ) {
                documents.push(this.toDocument(document));
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            previous: documents.length >= n ? documents[0] : null,
            documents: documents.slice(0, limit).reverse(),
            next: current,
        };
    }

    private getLastPage(limit: number, filter?: LowDbQuery): AASPagedResult {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null };
        }

        const n = limit + 1;
        const items = this.db.data.documents;
        const elements = this.db.data.elements;
        for (let i = items.length - 1; i >= 0; --i) {
            const document = items[i];
            const uuid = document.uuid;
            if (
                !filter ||
                filter.do(
                    document,
                    elements.filter(element => element.uuid === uuid),
                )
            ) {
                documents.push(this.toDocument(document));
                if (documents.length >= n) {
                    break;
                }
            }
        }

        return {
            previous: documents.length >= n ? documents[0] : null,
            documents: documents.slice(0, limit).reverse(),
            next: null,
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

    private traverseEnvironment(documentId: string, env: aas.Environment): void {
        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                this.writeElement(documentId, referable);
            }
        }
    }

    private writeElement(uuid: string, referable: aas.Referable): void {
        const element: LowDbElement = {
            uuid: uuid,
            modelType: this.toAbbreviation(referable),
            idShort: referable.idShort,
        };

        if (isIdentifiable(referable)) {
            element.id = referable.id;
        }

        let value: BaseValueType | undefined = this.toStringValue(referable);
        if (value) {
            element.value = value;
            element.valueType = 'string';
            this.db.data.elements.push(element);
            return;
        }

        value = this.toNumberValue(referable);
        if (value) {
            element.value = value.toString();
            element.valueType = 'number';
            this.db.data.elements.push(element);
            return;
        }

        value = this.toBooleanValue(referable);
        if (value) {
            element.value = value.toString();
            element.valueType = 'boolean';
            this.db.data.elements.push(element);
            return;
        }

        value = this.toBigintValue(referable);
        if (value) {
            element.value = value.toString();
            element.valueType = 'bigint';
            this.db.data.elements.push(element);
            return;
        }

        value = this.toDateValue(referable);
        if (value) {
            element.value = value.toISOString();
            element.valueType = 'Date';
            this.db.data.elements.push(element);
            return;
        }

        this.db.data.elements.push(element);
    }
}
