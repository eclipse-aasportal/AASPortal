/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
import { ApplicationError, GenericCache } from 'aas-core';

import { Database } from './database.js';
import { HashTable } from './hash-table.js';
import { KeyList } from './key-list.js';
import { DatabaseTable } from './database-table.js';
import { ERROR } from '../error.js';
import { DatabaseKey, DatabaseTableData, IndexItem, IndexPage, TableRef, Index, Table } from './database-types.js';

export class DatabaseIndex {
    private readonly map: HashTable;
    private readonly modifiedPages = new Map<number, IndexPage>();
    private readonly pageCache = new GenericCache<number, IndexPage>(100);

    public constructor(
        public readonly index: Index,
        public readonly name: string,
        protected readonly database: Database,
        protected readonly data: DatabaseTableData,
        public readonly pageSize: number,
        public readonly dir: string,
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

    public async *getItems(start: number): AsyncGenerator<IndexItem> {
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

    public findKey(id: string): Promise<DatabaseKey | undefined> {
        return this.map.get(id);
    }

    public async getItem(key: DatabaseKey): Promise<IndexItem> {
        const page = await this.readPage(Math.trunc(key / this.pageSize));
        const item = page.items[key % this.pageSize];
        if (item === null) {
            throw new Error('Invalid operation.');
        }

        return item;
    }

    public async getTableRefs(key: DatabaseKey): Promise<TableRef[]> {
        const page = await this.readPage(Math.trunc(key / this.pageSize));
        const item = page.items[key % this.pageSize];
        if (item === null) {
            throw new Error('Invalid operation.');
        }

        return item.tableRefs;
    }

    public async create(id: string, data: Record<string, unknown> = {}): Promise<DatabaseKey> {
        let key = await this.map.get(id);
        if (key !== undefined) {
            throw new ApplicationError(ERROR.INVALID_PACKAGE_ID, {}, 400);
        }

        key = this.createKey();
        const page = await this.getEditablePage(key);
        const item: IndexItem = { key, id, tableRefs: [], ...data };
        const index = key % this.pageSize;
        ++page.count;
        if (index < page.items.length) {
            page.items[index] = item;
        } else if (index === page.items.length) {
            page.items.push(item);
        } else {
            throw new Error('Invalid operation.');
        }

        await this.map.set(id, key);
        return key;
    }

    public async add(key: DatabaseKey, table: DatabaseTable, tableKey: DatabaseKey): Promise<void> {
        const tableIndex = table.index;
        const page = await this.getEditablePage(key);
        const index = key % this.pageSize;
        const item = page.items[index]!;
        if (item.tableRefs.some(([t, k]) => tableIndex === t && tableKey === k)) {
            return;
        }

        item.tableRefs.push([tableIndex, tableKey]);
        await table.setIndexLink(tableKey, this, key);
    }

    public async remove(key: DatabaseKey, table: Table, tableKey: DatabaseKey): Promise<void> {
        const page = await this.getEditablePage(key);
        const index = key % this.pageSize;
        const item = page.items[index];
        if (item === null) {
            throw new Error('Invalid operation.');
        }

        item.tableRefs = item.tableRefs.filter(([t, k]) => t !== table || k !== tableKey);
    }

    public async delete(id: string): Promise<boolean> {
        const key = await this.map.get(id);
        if (key === undefined) {
            return false;
        }

        const page = await this.getEditablePage(key);
        const index = key % this.pageSize;
        page.items[index] = null;
        if (page.items.every(item => item === null)) {
            await this.deletePage(page);
        }

        await this.map.delete(id);
        return true;
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

    private createKey(): DatabaseKey {
        const recycler = new KeyList(this.data.recycled);
        if (recycler.isEmpty) {
            const key = this.nextKey;
            ++this.nextKey;
            return key;
        }

        return recycler.pop();
    }

    private async getEditablePage(key: DatabaseKey): Promise<IndexPage> {
        const pageNumber = Math.trunc(key / this.pageSize);
        let page = this.modifiedPages.get(pageNumber);
        if (!page) {
            page = await this.readPage(pageNumber);
            this.modifiedPages.set(pageNumber, page);
        }

        return page;
    }

    private async readPage(pageNumber: number): Promise<IndexPage> {
        let page = this.pageCache.get(pageNumber);
        if (page) {
            return page;
        }

        const file = path.join(this.dir, pageNumber.toString() + '.json');
        if (!fs.existsSync(file)) {
            page = { page: pageNumber, count: 0, items: [] };
        } else {
            page = JSON.parse((await fs.promises.readFile(file)).toString()) as IndexPage;
        }

        this.pageCache.set(pageNumber, page);
        return page;
    }

    private async writePage(page: IndexPage): Promise<void> {
        const file = path.join(this.dir, page.page.toString() + '.json');
        if (fs.existsSync(file)) {
            const backup = path.join(this.dir, '~' + page.page.toString() + '.json');
            if (fs.existsSync(backup)) {
                await fs.promises.writeFile(file, JSON.stringify(page));
            } else {
                await fs.promises.copyFile(file, backup);
                await fs.promises.writeFile(file, JSON.stringify(page));
                this.database.fileUpdated(backup, file);
            }
        } else {
            await fs.promises.writeFile(file, JSON.stringify(page));
            this.database.fileAdded(file);
        }
    }

    private async deletePage(page: IndexPage): Promise<void> {
        const file = path.join(this.dir, page.page.toString() + '.json');
        await this.deleteFile(file);
        this.pageCache.delete(page.page);
    }

    private async deleteFile(file: string): Promise<void> {
        if (fs.existsSync(file)) {
            const backup = path.join(path.dirname(file), '~' + path.basename(file));
            if (!fs.existsSync(backup)) {
                await fs.promises.rename(file, backup);
                this.database.fileDeleted(backup, file);
            }
        }
    }
}
