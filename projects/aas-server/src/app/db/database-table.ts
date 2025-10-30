/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
import { PagedResult } from 'aas-core';
import { DatabaseKey, DatabaseTableData, TablePage, DataTableItem } from './database-types.js';
import { Database } from './database.js';
import { HashTable } from './hash-table.js';
import { KeyList } from './key-list.js';
import { Cursor } from '../types.js';
import { encodeBase64Url, toCursor } from '../utilities.js';

export abstract class DatabaseTable<TItem extends DataTableItem, TResult> {
    private readonly map: HashTable;
    private readonly modifiedPages = new Map<number, TablePage<TItem>>();

    protected constructor(
        public readonly name: string,
        protected readonly database: Database,
        protected readonly data: DatabaseTableData,
        public readonly pageSize: number,
        public readonly dir: string,
        protected readonly extension: string,
    ) {
        this.map = new HashTable(this.database, this.data, this.pageSize, this.dir);
    }

    public get nextKey(): DatabaseKey {
        return this.data.nextKey;
    }
    public set nextKey(value: DatabaseKey) {
        this.data.nextKey = value;
    }

    public get size(): number {
        return this.data.size;
    }

    public createKey(): DatabaseKey {
        const recycler = new KeyList(this.data.recycled);
        if (recycler.isEmpty) {
            const key = this.nextKey;
            ++this.nextKey;
            return key;
        }

        return recycler.pop();
    }

    public findKey(id: string): Promise<DatabaseKey | undefined> {
        return this.map.get(id);
    }

    public async setKey(id: string, key: DatabaseKey): Promise<void> {
        await this.map.set(id, key);
    }

    public deleteKey(id: string): Promise<boolean> {
        return this.map.delete(id);
    }

    public async getPage(
        limit: number,
        cursor: string | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TResult>> {
        const { previous, next } = toCursor(cursor);
        if (next !== null && !previous) {
            return await this.getNextPage(limit, next, predicate);
        }

        return await this.getPreviousPage(limit, previous, predicate);
    }

    public async get(key: DatabaseKey): Promise<TItem | null> {
        const page = await this.readPage(Math.trunc(key / this.pageSize));
        return page.items[key % this.pageSize];
    }

    public getFilePath(key: DatabaseKey): string {
        return path.join(this.dir, Math.trunc(key / this.pageSize).toString(), 'files', key + this.extension);
    }

    public async readJson(key: DatabaseKey): Promise<TResult> {
        return JSON.parse((await fs.promises.readFile(this.getFilePath(key))).toString()) as TResult;
    }

    public deleteFile(key: DatabaseKey): Promise<void> {
        return new Promise(resolve => {
            new KeyList(this.data.recycled).add(key);
            this.database.fileDeleted(this.getFilePath(key));
            resolve();
        });
    }

    public begin(): Promise<void> {
        return Promise.resolve();
    }

    public async commit(): Promise<void> {
        await this.map.commit();
        for (const page of this.modifiedPages.values()) {
            await this.writePage(page);
        }

        this.modifiedPages.clear();
    }

    public async abort(): Promise<void> {
        await this.map.abort();
        this.modifiedPages.clear();
    }

    public async getEditablePage(key: DatabaseKey): Promise<TablePage<TItem>> {
        const pageNumber = Math.trunc(key / this.pageSize);
        let page = this.modifiedPages.get(pageNumber);
        if (!page) {
            page = await this.readPage(pageNumber);
            this.modifiedPages.set(pageNumber, page);
        }

        return page;
    }

    public async readPage(pageNumber: number): Promise<TablePage<TItem>> {
        const file = path.join(this.dir, pageNumber.toString(), 'page.json');
        if (!fs.existsSync(file)) {
            return { key: pageNumber, count: 0, items: [] };
        }

        return JSON.parse((await fs.promises.readFile(file)).toString());
    }

    public async createBackup(key: DatabaseKey): Promise<string> {
        const pageNumber = Math.trunc(key / this.pageSize);
        const file = path.join(this.dir, pageNumber.toString(), 'files', key + this.extension);
        const backup = path.join(this.dir, pageNumber.toString(), 'files', '~' + key + this.extension);
        if (!fs.existsSync(backup)) {
            await fs.promises.copyFile(file, backup);
            this.database.fileUpdated(backup, file);
        }

        return file;
    }

    protected abstract readPageItem(item: TItem): Promise<TResult>;

    private async writePage(page: TablePage<TItem>): Promise<void> {
        const pageDir = path.join(this.dir, page.key.toString());
        const file = path.join(pageDir, 'page.json');
        if (fs.existsSync(file)) {
            const backup = path.join(pageDir, '~page.json');
            if (fs.existsSync(backup)) {
                await fs.promises.writeFile(file, JSON.stringify(page));
            } else {
                await fs.promises.copyFile(file, backup);
                await fs.promises.writeFile(file, JSON.stringify(page));
                this.database.fileUpdated(backup, file);
            }
        } else {
            if (!fs.existsSync(pageDir)) {
                await fs.promises.mkdir(path.join(pageDir, 'files'), { recursive: true });
            }

            await fs.promises.writeFile(file, JSON.stringify(page));
            this.database.fileAdded(file);
        }
    }

    private async getNextPage(
        limit: number,
        next: string | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TResult>> {
        let index = 0;
        const cursor: Cursor = {};
        if (next) {
            index = Number(next);
            cursor.previous = (index - 1).toString();
        }

        if (isNaN(index) || index < 0) {
            throw new Error('Invalid operation.');
        }

        if (index >= this.size) {
            return {
                result: [],
                paging_metadata: {},
            };
        }

        const result: TResult[] = [];
        for await (const item of this.forward(index)) {
            if (result.length >= limit) {
                cursor.next = item.key.toString();
                break;
            }

            if (predicate === undefined || predicate(item)) {
                result.push(await this.readPageItem(item));
            }
        }

        return {
            result,
            paging_metadata: cursor.next ? { cursor: encodeBase64Url(JSON.stringify(cursor)) } : {},
        };
    }

    private async getPreviousPage(
        limit: number,
        previous: string | null | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TResult>> {
        const index = previous ? Number(previous) : this.data.size - 1;
        if (isNaN(index) || index < 0 || index >= this.data.size) {
            throw new Error('Invalid operation.');
        }

        const cursor: Cursor = {};
        if (previous) {
            cursor.next = previous;
        }

        const result: TResult[] = [];
        for await (const item of this.reverse(index)) {
            if (result.length >= limit) {
                cursor.previous = item.key.toString();
                break;
            }

            if (predicate === undefined || predicate(item)) {
                result.push(await this.readPageItem(item));
            }
        }

        return {
            result: result.reverse(),
            paging_metadata: cursor.previous ? { cursor: encodeBase64Url(JSON.stringify(cursor)) } : {},
        };
    }

    private async *forward(start: number = 0): AsyncGenerator<TItem> {
        let pageNumber: DatabaseKey = Math.trunc(start / this.pageSize);
        let page = await this.readPage(pageNumber);
        let index = start;
        while (index < this.data.size) {
            const k = Math.trunc(index / this.pageSize);
            if (k !== pageNumber) {
                pageNumber = k;
                page = await this.readPage(pageNumber);
            }

            const item = page.items[index % this.pageSize];
            if (item) {
                yield item;
            }

            ++index;
        }
    }

    private async *reverse(start: number): AsyncGenerator<TItem> {
        let pageNumber: DatabaseKey = Math.trunc(start / this.pageSize);
        let page = await this.readPage(pageNumber);
        let index = start;
        while (index >= 0) {
            const k = Math.trunc(index / this.pageSize);
            if (k !== pageNumber) {
                pageNumber = k;
                page = await this.readPage(pageNumber);
            }

            const item = page.items[index % this.pageSize];
            if (item) {
                yield item;
            }

            --index;
        }
    }
}
