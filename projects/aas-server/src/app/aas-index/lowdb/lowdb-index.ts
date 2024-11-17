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
import { ERRORS } from '../../errors.js';
import { LowDbData, LowDbDocument, LowDbElement } from './lowdb-types.js';
import { decodeBase64Url, encodeBase64Url } from '../../convert.js';
import { PagedResult } from '../../types/paged-result.js';
import { KeywordDirectory } from '../keyword-directory.js';
import { Logger } from '../../logging/logger.js';

export class LowDbIndex extends AASIndex {
    public constructor(
        private readonly logger: Logger,
        private readonly variable: Variable,
        private readonly db: Low<LowDbData>,
        keywordDirectory: KeywordDirectory,
    ) {
        super(keywordDirectory);
    }

    public override destroy(): Promise<void> {
        return Promise.resolve();
    }

    public override getCount(endpoint?: string): Promise<number> {
        return new Promise<number>(resolve => {
            if (endpoint === undefined) {
                resolve(this.db.data.documents.length);
                return;
            }

            let count = 0;
            this.db.data.documents.forEach(item => {
                if (item.endpoint === endpoint) {
                    ++count;
                }
            });

            resolve(count);
        });
    }

    public override getEndpoints(): Promise<AASEndpoint[]> {
        return new Promise<AASEndpoint[]>(resolve => {
            resolve(this.db.data.endpoints);
        });
    }

    public override getEndpointCount(): Promise<number> {
        return new Promise<number>(resolve => {
            resolve(this.db.data.endpoints.length);
        });
    }

    public override getEndpoint(name: string): Promise<AASEndpoint> {
        return new Promise<AASEndpoint>(resolve => {
            const endpoint = this.db.data.endpoints.find(endpoint => endpoint.name === name);
            if (!endpoint) {
                throw new Error(`An endpoint with the name ${name} does not exist.`);
            }

            resolve(endpoint);
        });
    }

    public override hasEndpoint(name: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            resolve(this.db.data.endpoints.find(endpoint => endpoint.name === name) !== undefined);
        });
    }

    public override async addEndpoint(endpoint: AASEndpoint): Promise<void> {
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
        const index = this.db.data.endpoints.findIndex(endpoint => endpoint.name === endpointName);
        if (index < 0) {
            return false;
        }

        this.db.data.endpoints.splice(index, 1);
        this.removeDocuments(endpointName);
        await this.db.write();
        return true;
    }

    public override nextPage(
        endpointName: string,
        cursor: string | undefined,
        limit: number = 100,
    ): Promise<PagedResult<AASDocument>> {
        return new Promise<PagedResult<AASDocument>>(resolve => {
            if (cursor) {
                cursor = decodeBase64Url(cursor);
            }

            const documents: AASDocument[] = [];
            if (this.db.data.documents.length === 0) {
                resolve({ result: documents, paging_metadata: {} });
                return;
            }

            const items = this.db.data.documents;
            const index = items.findIndex(item => {
                if (item.endpoint !== endpointName) {
                    return false;
                }

                return cursor === undefined || cursor.localeCompare(item.id) <= 0;
            });

            if (index < 0) {
                resolve({ result: documents, paging_metadata: {} });
                return;
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
                resolve({ result, paging_metadata: {} });
                return;
            }

            resolve({ result, paging_metadata: { cursor: encodeBase64Url(items[k].id) } });
        });
    }

    public override getDocuments(cursor: AASCursor, expression?: string, language?: string): Promise<AASPagedResult> {
        return new Promise<AASPagedResult>(resolve => {
            let query: LowDbQuery | undefined;
            if (expression) {
                query = new LowDbQuery(expression, language ?? 'en');
            }

            if (cursor.next) {
                resolve(this.getNextPage(cursor.next, cursor.limit, query));
            } else if (cursor.previous) {
                resolve(this.getPreviousPage(cursor.previous, cursor.limit, query));
            } else if (cursor.previous === null) {
                resolve(this.getFirstPage(cursor.limit, query));
            } else {
                resolve(this.getLastPage(cursor.limit, query));
            }
        });
    }

    public override async update(document: AASDocument): Promise<void> {
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

    public override find(endpointName: string | undefined, id: string): Promise<AASDocument | undefined> {
        return new Promise<AASDocument | undefined>(resolve => {
            const document = endpointName
                ? this.db.data.documents.find(
                      item => item.endpoint === endpointName && (item.id === id || item.assetId === id),
                  )
                : this.db.data.documents.find(item => item.id === id || item.assetId === id);

            if (document === undefined) {
                resolve(undefined);
                return;
            }
            resolve(this.toDocument(document));
        });
    }

    public override async add(document: AASDocument): Promise<void> {
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
