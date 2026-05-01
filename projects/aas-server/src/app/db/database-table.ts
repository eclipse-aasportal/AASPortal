/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
import { GenericCache, normalize, PagedResult } from 'aas-core';
import { encodeBase64Url } from 'aas-package';
import { DatabaseKey, DatabaseTableData, TablePage, DataTableItem, Table, Index, IndexRef } from './database-types.js';
import { Database } from './database.js';
import { HashTable } from './hash-table.js';
import { KeyList } from './key-list.js';
import { Cursor } from '../types.js';
import { toCursor } from '../utilities.js';
import { ERROR } from '../error.js';
import { DatabaseIndex } from './database-index.js';

export abstract class DatabaseTable<TItem extends DataTableItem = DataTableItem, TObject = object> {
    private readonly map: HashTable;
    private readonly modifiedPages = new Map<number, TablePage<TItem>>();
    private readonly objCache = new GenericCache<DatabaseKey, TObject>(100);
    private readonly pageCache = new GenericCache<number, TablePage<TItem>>(100);

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

    public abstract readonly index: Table;

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

    public abstract getKey(id: string): Promise<DatabaseKey>;

    public findKey(id: string): Promise<DatabaseKey | undefined> {
        return this.map.get(id);
    }

    public async getPage(
        limit: number,
        cursor: string | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TObject>> {
        const { previous, next } = toCursor(cursor);
        if (next !== null) {
            return await this.getNextPage(limit, next, predicate);
        }

        return await this.getPreviousPage(limit, previous, predicate);
    }

    public async get(key: DatabaseKey): Promise<TItem | null> {
        const page = await this.readPage(Math.trunc(key / this.pageSize));
        return page.items[key % this.pageSize];
    }

    public async insert(obj: TObject): Promise<DatabaseKey> {
        const key = this.createKey();
        const page = await this.getEditablePage(key);
        const item = this.createItem(key, obj);
        const index = key % this.pageSize;
        ++page.count;
        if (index < page.items.length) {
            page.items[index] = item;
        } else if (index === page.items.length) {
            page.items.push(item);
        } else {
            throw new Error('Invalid operation.');
        }

        await this.map.set(item.id, key);
        await this.writeObject(obj, key);
        return key;
    }

    public async update(key: DatabaseKey, obj: TObject, deleteAssets: boolean = false): Promise<void> {
        await this.writeObject(obj, key);
        if (deleteAssets) {
            await this.updateDir(this.getAssetsDir(key));
        }
    }

    public async delete(id: string): Promise<void> {
        const key = await this.getKey(id);
        const index = key % this.pageSize;
        const page = await this.getEditablePage(key);
        const refs = page.items[index]?.indexRefs;
        if (refs) {
            for (const [t, k] of refs) {
                await this.database.getIndex(t).remove(k, this.index, key);
            }
        }

        page.items[index] = null;
        if (page.items.every(item => item === null)) {
            await this.deletePage(page);
        }

        new KeyList(this.data.recycled).add(key);
        await this.deleteFile(this.getFilePath(key));
        await this.deleteDir(this.getAssetsDir(key));
        await this.map.delete(id);
        this.objCache.delete(key);
    }

    public getFilePath(key: DatabaseKey): string {
        return path.join(this.dir, Math.trunc(key / this.pageSize).toString(), 'files', key + this.extension);
    }

    public getAssetsDir(key: DatabaseKey): string {
        return path.join(this.dir, Math.trunc(key / this.pageSize).toString(), 'assets', key.toString());
    }

    public async setIndexLink(key: DatabaseKey, index: DatabaseIndex, indexKey: DatabaseKey): Promise<void> {
        const page = await this.getEditablePage(key);
        const i = key % this.pageSize;
        const item = page.items[i];
        if (!item) {
            throw new Error('Invalid operation.');
        }

        item.indexRefs.push([index.index, indexKey]);
    }

    public readAsset(key: DatabaseKey, filename: string): NodeJS.ReadableStream {
        const file = path.join(this.getAssetsDir(key), normalize(filename));
        return fs.createReadStream(file);
    }

    public async writeAsset(key: DatabaseKey, filename: string, source: string | NodeJS.ReadableStream): Promise<void> {
        const dest = path.join(this.getAssetsDir(key), path.normalize(filename));
        const dir = path.dirname(dest);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        if (fs.existsSync(dest)) {
            const backup = path.join(path.dirname(dest), '~' + path.basename(dest));
            if (!fs.existsSync(backup)) {
                await fs.promises.copyFile(dest, backup);
                this.database.fileUpdated(backup, dest);
            }

            if (typeof source === 'string') {
                await fs.promises.copyFile(source, dest);
            } else {
                source.pipe(fs.createWriteStream(dest));
            }
        } else {
            if (typeof source === 'string') {
                await fs.promises.copyFile(source, dest);
            } else {
                source.pipe(fs.createWriteStream(dest));
            }

            this.database.fileAdded(dest);
        }
    }

    public async deleteAsset(key: DatabaseKey, filename: string): Promise<void> {
        const file = path.join(this.getAssetsDir(key), path.normalize(filename));
        await this.deleteFile(file);
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

    public async readObject(key: DatabaseKey): Promise<TObject> {
        let obj = this.objCache.get(key);
        if (obj) {
            return obj;
        }

        obj = JSON.parse((await fs.promises.readFile(this.getFilePath(key))).toString()) as TObject;
        this.objCache.set(key, obj);
        return obj;
    }

    public async writeObject(obj: TObject, key: DatabaseKey): Promise<void> {
        const pageNumber = Math.trunc(key / this.pageSize);
        const dir = path.join(this.dir, pageNumber.toString(), 'files');
        const file = path.join(dir, key + '.json');
        if (fs.existsSync(file)) {
            const backup = path.join(dir, '~' + key + '.json');
            if (fs.existsSync(backup)) {
                await fs.promises.writeFile(file, JSON.stringify(obj));
            } else {
                await fs.promises.copyFile(file, backup);
                await fs.promises.writeFile(file, JSON.stringify(obj));
                this.database.fileUpdated(backup, file);
            }
        } else {
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }

            await fs.promises.writeFile(file, JSON.stringify(obj));
            this.database.fileAdded(file);
        }

        this.objCache.set(key, obj);
    }

    public async getItem(key: DatabaseKey): Promise<TItem> {
        const item = await this.get(key);
        if (!item) {
            throw new Error(ERROR.INVALID_OPERATION);
        }

        return item;
    }

    public async getIndexRefs(key: DatabaseKey, index?: Index): Promise<IndexRef[]> {
        const item = await this.get(key);
        if (!item) {
            throw new Error(ERROR.INVALID_OPERATION);
        }

        return index ? item.indexRefs.filter(([t]) => t === index) : item.indexRefs;
    }

    protected abstract createItem(key: DatabaseKey, obj: TObject): TItem;

    private async getEditablePage(key: DatabaseKey): Promise<TablePage<TItem>> {
        const pageNumber = Math.trunc(key / this.pageSize);
        let page = this.modifiedPages.get(pageNumber);
        if (!page) {
            page = await this.readPage(pageNumber);
            this.modifiedPages.set(pageNumber, page);
        }

        return page;
    }

    private async readPage(pageNumber: number): Promise<TablePage<TItem>> {
        let page = this.pageCache.get(pageNumber);
        if (page) {
            return page;
        }

        const file = path.join(this.dir, pageNumber.toString(), 'page.json');
        if (!fs.existsSync(file)) {
            page = { page: pageNumber, count: 0, items: [] };
        } else {
            page = JSON.parse((await fs.promises.readFile(file)).toString()) as TablePage<TItem>;
        }

        this.pageCache.set(pageNumber, page);
        return page;
    }

    private async writePage(page: TablePage<TItem>): Promise<void> {
        const pageDir = path.join(this.dir, page.page.toString());
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

    private async deletePage(page: TablePage<TItem>): Promise<void> {
        const pageDir = path.join(this.dir, page.page.toString());
        await fs.promises.rm(pageDir, { recursive: true, force: true });
        await this.deleteDir(pageDir);
        this.pageCache.delete(page.page);
    }

    private async getNextPage(
        limit: number,
        next: string | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TObject>> {
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

        const result: TObject[] = [];
        for await (const item of this.forward(index)) {
            if (result.length >= limit) {
                cursor.next = item.key.toString();
                break;
            }

            if (predicate === undefined || predicate(item)) {
                result.push(await this.readObject(item.key));
            }
        }

        return {
            result,
            paging_metadata: cursor.next !== undefined ? { cursor: encodeBase64Url(JSON.stringify(cursor)) } : {},
        };
    }

    private async getPreviousPage(
        limit: number,
        previous: string | null | undefined,
        predicate?: (item: TItem) => boolean,
    ): Promise<PagedResult<TObject>> {
        const index = previous ? Number(previous) : this.data.size - 1;
        if (isNaN(index) || index < 0 || index >= this.data.size) {
            throw new Error('Invalid operation.');
        }

        const cursor: Cursor = {};
        if (previous) {
            cursor.next = previous;
        }

        const result: TObject[] = [];
        for await (const item of this.reverse(index)) {
            if (result.length >= limit) {
                cursor.previous = item.key.toString();
                break;
            }

            if (predicate === undefined || predicate(item)) {
                result.push(await this.readObject(item.key));
            }
        }

        return {
            result: result.reverse(),
            paging_metadata: cursor.previous !== undefined ? { cursor: encodeBase64Url(JSON.stringify(cursor)) } : {},
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

    private async deleteFile(file: string): Promise<void> {
        if (fs.existsSync(file)) {
            const backup = path.join(path.dirname(file), '~' + path.basename(file));
            if (!fs.existsSync(backup)) {
                await fs.promises.rename(file, backup);
                this.database.fileDeleted(backup, file);
            }
        }
    }

    private async updateDir(dir: string): Promise<void> {
        if (fs.existsSync(dir)) {
            const backup = path.join(path.dirname(dir), '~' + path.basename(dir));
            if (!fs.existsSync(backup)) {
                await fs.promises.rename(dir, backup);
                this.database.dirUpdated(backup, dir);
            }
        }
    }

    private async deleteDir(dir: string): Promise<void> {
        if (fs.existsSync(dir)) {
            const backup = path.join(path.dirname(dir), '~' + path.basename(dir));
            if (!fs.existsSync(backup)) {
                await fs.promises.rename(dir, backup);
                this.database.dirDeleted(backup, dir);
            }
        }
    }
}
