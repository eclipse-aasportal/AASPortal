/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { DatabaseKey, DatabaseTableData, HashTablePage } from './database-types.js';
import { Database } from './database.js';

export class HashTable {
    private currentPage?: [DatabaseKey, HashTablePage];
    private modified = new Map<DatabaseKey, HashTablePage>();

    public constructor(
        private readonly database: Database,
        private readonly table: DatabaseTableData,
        private readonly pageSize: number,
        private readonly dir: string,
    ) {}

    public async set(key: string, value: DatabaseKey): Promise<void> {
        if (this.table.size >= this.table.capacity) {
            await this.increaseCapacity();
        }

        const hc = this.hashCode(key);
        const index = hc % this.table.capacity;
        const pageKey = Math.trunc(index / this.pageSize);
        const pageIndex = index % this.pageSize;
        let page = await this.getPage(pageKey);
        if (page === undefined) {
            page = await this.readPage(pageIndex);
            if (page === undefined) {
                page = [];
            }

            this.currentPage = [pageKey, page];
        }

        this.modified.set(pageKey, page);
        const bucket = page[pageIndex];
        if (bucket) {
            for (const keyValue of bucket) {
                if (keyValue[0] === key) {
                    keyValue[1] = value;
                    return;
                }
            }

            bucket.push([key, value]);
        } else {
            page[pageIndex] = [];
            page[pageIndex].push([key, value]);
        }

        ++this.table.size;
    }

    public async get(key: string): Promise<DatabaseKey | undefined> {
        const hc = this.hashCode(key);
        const index = hc % this.table.capacity;
        const pageKey = Math.trunc(index / this.pageSize);
        const pageIndex = index % this.pageSize;
        const page = await this.getPage(pageKey);
        if (page === undefined) {
            return undefined;
        }

        const bucket = page[pageIndex];
        if (bucket) {
            for (const keyValue of bucket) {
                if (keyValue[0] === key) {
                    return keyValue[1];
                }
            }
        }

        return undefined;
    }

    public async delete(key: string): Promise<boolean> {
        const hc = this.hashCode(key);
        const index = hc % this.table.capacity;
        const pageKey = Math.trunc(index / this.pageSize);
        const pageIndex = index % this.pageSize;
        let page = await this.getPage(pageKey);
        if (page === undefined) {
            page = await this.readPage(pageKey);
            if (page === undefined) {
                return false;
            }

            this.currentPage = [pageKey, page];
        }

        const bucket = page[pageIndex];
        if (bucket && bucket.length) {
            for (let i = 0; i < bucket.length; i++) {
                if (bucket[i][0] === key) {
                    bucket.splice(i, 1);
                    this.modified.set(pageKey, page);
                    --this.table.size;
                    return true;
                }
            }
        }

        return false;
    }

    public async commit(): Promise<void> {
        const dir = path.join(this.dir, 'ht');
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir);
        }

        for (const page of this.modified) {
            const file = path.join(dir, page[0] + '.json');
            if (fs.existsSync(file)) {
                const backup = path.join(dir, '~' + page[0] + '.json');
                if (!fs.existsSync(backup)) {
                    await fs.promises.copyFile(file, backup);
                    this.database.fileUpdated(backup, file);
                }
            } else {
                this.database.fileAdded(file);
            }

            await fs.promises.writeFile(file, JSON.stringify(page[1]));
        }

        this.modified.clear();
    }

    public abort(): Promise<void> {
        return new Promise(resolve => {
            this.modified.clear();
            resolve();
        });
    }

    private async getPage(pageKey: DatabaseKey): Promise<HashTablePage | undefined> {
        if (this.currentPage === undefined || this.currentPage[0] !== pageKey) {
            let page = this.modified.get(pageKey);
            if (page === undefined) {
                page = await this.readPage(pageKey);
                if (page === undefined) {
                    this.currentPage = undefined;
                    return undefined;
                }
            }

            this.currentPage = [pageKey, page];
        }

        return this.currentPage[1];
    }

    private hashCode(value: string): number {
        let hash = 0;
        if (value.length === 0) {
            return hash;
        }

        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0;
        }

        return hash >= 0 ? hash : 4294967296 + hash;
    }

    private async readPage(pageKey: number): Promise<HashTablePage | undefined> {
        const file = path.join(this.dir, 'ht', pageKey + '.json');
        if (fs.existsSync(file)) {
            return JSON.parse((await fs.promises.readFile(file)).toString());
        }

        return undefined;
    }

    private async increaseCapacity(): Promise<void> {
        this.currentPage = undefined;
        const n = Math.trunc(this.table.capacity / this.pageSize);
        for (let i = 0; i < n; i++) {
            const page = this.modified.get(i);
            this.modified.delete(i);
            await this.backup(i, page);
        }

        this.table.capacity *= 2;
        this.table.size = 0;
        let page: HashTablePage | undefined;
        for (let i = 0; i < n; i++) {
            page = await this.readBackup(i);
            if (page === undefined) {
                continue;
            }

            for (const bucket of page) {
                if (bucket) {
                    for (const keyValue of bucket) {
                        await this.set(keyValue[0], keyValue[1]);
                    }
                }
            }
        }

        for (let i = 0; i < n; i++) {
            await fs.promises.unlink(path.join(this.dir, 'ht', '#' + i + '.json'));
        }
    }

    private async backup(pageKey: number, page?: HashTablePage): Promise<void> {
        const dir = path.join(this.dir, 'ht');
        const file = path.join(dir, pageKey + '.json');
        const backup = path.join(dir, '#' + pageKey + '.json');
        if (fs.existsSync(backup)) {
            return;
        }

        if (page) {
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir);
            }

            await fs.promises.writeFile(backup, JSON.stringify(page));
        } else {
            await fs.promises.rename(file, backup);
        }
    }

    private async readBackup(pageKey: number): Promise<HashTablePage | undefined> {
        const file = path.join(this.dir, 'ht', '#' + pageKey + '.json');
        if (fs.existsSync(file)) {
            return JSON.parse((await fs.promises.readFile(file)).toString());
        }

        return undefined;
    }
}
