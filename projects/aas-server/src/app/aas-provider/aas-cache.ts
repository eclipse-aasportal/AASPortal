/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { getEndpointType } from '../configuration.js';
import { ERRORS } from '../errors.js';
import { Container } from './container.js';
import { AASDocument, ApplicationError, AASContainer } from 'common';

export class AASCache {
    private _containers = new Map<string, Container>();

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

    public get(url: string, id: string): AASDocument {
        const container = this._containers.get(this.getKey(url));
        if (container) {
            const document = container.find(id);
            if (document) {
                return document;
            }
        }

        throw new ApplicationError(
            `An AAS with the identification ${id} does not exist in the container '${url}'.`,
            ERRORS.AASNotFound,
            id,
            url);
    }

    public add(document: AASDocument): void {
        const key = this.getKey(document.container);
        const container = this._containers.get(key);
        if (!container) {
            throw new Error(`A container with the URL '${key}' does not exist.`);
        }

        if (container.has(document.id)) {
            throw new Error(`A document with the identification '${document.id}' already exists.`);
        }

        container.set(document);
    }

    public set(document: AASDocument): boolean {
        const key = this.getKey(document.container);
        const container = this._containers.get(key);
        if (!container) {
            throw new Error(`A container with the URL '${key}' does not exist.`);
        }

        const has = container.has(document.id);
        container.set(document);
        return !has;
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
                ERRORS.ContainerUrlAlreadyExists,
                descriptor.url);
        }

        const container: Container = new Container(url.href, descriptor.name, endpoint);
        this._containers.set(key, container);
        return container;
    }

    public *select(match: (document: AASDocument) => boolean): Generator<AASDocument> {
        match = match ?? function () { return true; };

        for (const container of this._containers.values()) {
            for (const document of container.documents) {
                if (match(document)) {
                    yield document;
                }
            }
        }
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