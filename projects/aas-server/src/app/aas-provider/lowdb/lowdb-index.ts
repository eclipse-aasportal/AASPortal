/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Low } from 'lowdb';
import { v4 } from 'uuid';
import { AASCursor, AASDocument, AASDocumentId, AASEndpoint, AASPage, ApplicationError, aas } from 'common';
import { AASIndex } from '../aas-index.js';
import { LowDbQuery } from './lowdb-query.js';
import { Variable } from '../../variable.js';
import { urlToEndpoint } from '../../configuration.js';
import { ERRORS } from '../../errors.js';
import { LowDbData, LowDbDocument, LowDbElement } from './lowdb-types.js';

export class LowDbIndex extends AASIndex {
    private readonly promise: Promise<void>;

    constructor(private readonly db: Low<LowDbData>, private readonly variable: Variable) {
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

    public override async getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPage> {
        await this.promise;

        let filter: LowDbQuery | undefined;
        if (query) {
            filter = new LowDbQuery(query, language ?? 'en');
        }

        if (cursor.next) {
            return this.getNextPage(cursor.next, cursor.limit, filter);
        }

        if (cursor.previous) {
            return this.getPreviousPage(cursor.previous, cursor.limit, filter);
        }

        if (cursor.previous === null) {
            return this.getFirstPage(cursor.limit, filter);
        }

        return this.getLastPage(cursor.limit, filter);
    }

    public override async set(document: AASDocument): Promise<void> {
        await this.promise;
        const name = document.endpoint;
        const documents = this.db.data.documents;
        const index = documents.findIndex(item => item.endpoint === name && item.id === document.id);

        if (index >= 0) {
            const documentId = documents[index].uuid;
            documents[index] = { ...document, uuid: documentId };
            this.db.data.elements = this.db.data.elements.filter(element => element.documentId !== documentId);
            if (document.content) {
                this.traverseEnvironment(documentId, document.content);
            }

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

        return this.toDocument(document);
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
        this.db.data.elements = this.db.data.elements.filter(element => element.documentId !== documentId);

        documents.splice(index, 1);
        await this.db.write();
        return true;
    }

    public async reset(): Promise<void> {
        this.db.data.documents = [];
        this.db.data.endpoints =
            this.variable.ENDPOINTS.map(endpoint => urlToEndpoint(endpoint));

        await this.db.write();
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

    private getFirstPage(limit: number, filter?: LowDbQuery): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null, totalCount: 0 };
        }

        const n = limit + 1;
        const elements = this.db.data.elements;
        for (const document of this.db.data.documents) {
            const uuid = document.uuid;
            if (!filter || filter.do(document, elements.filter(element => element.documentId === uuid))) {
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
            totalCount: this.db.data.documents.length
        };
    }

    private getNextPage(current: AASDocumentId, limit: number, filter?: LowDbQuery): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null, totalCount: 0 };
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
            if (!filter || filter.do(document, elements.filter(element => element.documentId === uuid))) {
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
            totalCount: items.length
        };
    }

    private getPreviousPage(current: AASDocumentId, limit: number, filter?: LowDbQuery): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null, totalCount: 0 };
        }

        const n = limit + 1
        const items = this.db.data.documents;
        let i = this.findIndexReverse(current);
        if (i < 0) {
            return this.getFirstPage(limit, filter);
        }

        const elements = this.db.data.elements;
        for (; i >= 0; --i) {
            const document = items[i];
            const uuid = document.uuid;
            if (!filter || filter.do(document, elements.filter(element => element.documentId === uuid))) {
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
            totalCount: items.length
        };
    }

    private getLastPage(limit: number, filter?: LowDbQuery): AASPage {
        const documents: AASDocument[] = [];
        if (this.db.data.documents.length === 0) {
            return { previous: null, documents, next: null, totalCount: 0 };
        }

        const n = limit + 1
        const items = this.db.data.documents;
        const elements = this.db.data.elements;
        for (let i = items.length - 1; i >= 0; --i) {
            const document = items[i];
            const uuid = document.uuid;
            if (!filter || filter.do(document, elements.filter(element => element.documentId === uuid))) {
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
            totalCount: items.length
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
            this.traverse(documentId, submodel, '');
        }
    }

    private traverse(documentId: string, parent: aas.Referable, path: string): void {
        const element: LowDbElement = {
            documentId,
            path,
            modelType: parent.modelType,
            idShort: parent.idShort
        };

        switch (parent.modelType) {
            case 'Property':
                element.value = (parent as aas.Property).value;
                element.valueType = (parent as aas.Property).valueType;
                break;
            case 'MultiLanguageProperty':
                element.value = (parent as aas.MultiLanguageProperty).value?.map(item => item.text).join(' ');
                break;
            case 'File':
                element.value = (parent as aas.File).value + ' ' + (parent as aas.File).contentType;
                break;
            case 'Blob':
                element.value = (parent as aas.Blob).contentType;
                break;
            case 'Range':
                element.value = (parent as aas.Range).min + ' ' + (parent as aas.Range).max;
                element.valueType = (parent as aas.Range).valueType;
                break;
            case 'Entity':
                element.value = (parent as aas.Entity).globalAssetId;
                break;
        }

        this.db.data.elements.push(element);

        const children = this.getChildren(parent);
        if (children) {
            for (const child of children) {
                this.traverse(documentId, child, path ? path + '.' + parent.idShort : parent.idShort);
            }
        }
    }

    private getChildren(parent: aas.Referable): aas.Referable[] | undefined {
        switch (parent.modelType) {
            case 'Submodel':
                return (parent as aas.Submodel).submodelElements;
            case 'SubmodelElementCollection':
                return (parent as aas.SubmodelElementCollection).value;
            case 'SubmodelElementList':
                return (parent as aas.SubmodelElementList).value;
            default:
                return undefined;
        }
    }
}