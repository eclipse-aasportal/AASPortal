/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { getEndpointType } from '../configuration.js';
import path from 'path';
import fs from 'fs';
import { ERRORS } from '../errors.js';
import { Container } from './container.js';
import { AASDocument, ApplicationError, AASContainer } from 'common';
import { Variable } from '../variable.js';
import { AASCache } from './aas-cache.js';

@singleton()
export class LocaleCache extends AASCache {
    private _containers = new Map<string, Container>();
    private readonly rootDir: string;

    constructor(
        @inject(Variable) private readonly variable: Variable
    ) {
        super();
        
        this.rootDir = path.resolve(this.variable.CONTENT_ROOT, 'cache');
        if (!fs.existsSync(this.rootDir)) {
            fs.mkdirSync(this.rootDir);
        }
    }

    /** All containers over all workspaces. */
    public get containers(): IterableIterator<Container> {
        return this._containers.values();
    }

    public has(url: string, id: string): boolean {
        const container = this._containers.get(this.getKey(url));
        if (container) {
            return container.has(id);
        }

        return false;
    }

    public async getAsync(url: string, id: string): Promise<AASDocument> {
        const container = this._containers.get(this.getKey(url));
        if (!container) {
            throw new ApplicationError(
                `An AAS container with the URL "${url}" does not exist.`,
                ERRORS.ContainerDoesNotExist,
                url);
        }

        return await container.getAsync(id);
    }

    public async addAsync(document: AASDocument): Promise<void> {
        const url = this.getKey(document.container);
        const container = this._containers.get(url);
        if (!container) {
            throw new ApplicationError(
                `An AAS container with the URL "${url}" does not exist.`,
                ERRORS.ContainerDoesNotExist,
                url);
        }

        if (container.has(document.id)) {
            throw new ApplicationError(
                `A document with the identification '${document.id}' already exists.`,
                ERRORS.AASAlreadyExists,
                document.id);
        }

        await container.addAsync(document);
    }

    public hasContainer(url: string): boolean {
        return this._containers.has(this.getKey(url));
    }

    public getContainer(url: string): Container {
        const key = this.getKey(url);
        const container = this._containers.get(key);
        if (!container) {
            throw new Error(`A container with the URL '${key}' does not exist.`);
        }

        return container;
    }

    public deleteContainer(container: Container): boolean {
        return this._containers.delete(this.getKeyFromUrl(container.url));
    }

    public addNewContainer(descriptor: AASContainer, endpoint: string): Container {
        const url = this.isValidUrl(descriptor.url);
        if (!url) {
            throw new Error(`${descriptor.url} is an invalid URL.`);
        }

        const key = this.getKeyFromUrl(url);
        if (this._containers.has(key)) {
            throw new ApplicationError(
                `A container with the URL '${key}' already exists.`,
                ERRORS.ContainerAlreadyExists,
                descriptor.url);
        }

        const container: Container = new Container(this.rootDir, url.href, descriptor.name, endpoint);
        this._containers.set(key, container);
        return container;
    }

    public find(match: (document: AASDocument) => boolean): AASDocument | undefined {
        for (const container of this._containers.values()) {
            for (const document of container.documents) {
                if (match(document)) {
                    return document;
                }
            }
        }

        return undefined;
    }

    public delete(url: string, id: string): boolean {
        let removed = false;
        const container = this._containers.get(this.getKey(url));
        if (container) {
            removed = container.remove(id);
        }

        return removed;
    }

    public reset(): void {
        this._containers.clear();
    }

    private getKey(url: string): string {
        return url.split('?')[0];
    }

    private getKeyFromUrl(url: URL): string {
        return url.href.split('?')[0];
    }

    private isValidUrl(value: string): URL | undefined {
        if (value) {
            try {
                const url = new URL(value);
                const type = getEndpointType(url);
                if (type === 'AasxServer' || type === 'OpcuaServer' || type === 'AasxDirectory' || type === 'AASRegistry') {
                    return url;
                }
            } catch (error) {
                return undefined;
            }
        }

        return undefined;
    }
}