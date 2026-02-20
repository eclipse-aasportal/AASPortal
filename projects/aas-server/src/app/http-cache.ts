/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { aas, Cache, PackageDescription, PagedResult } from 'aas-core';

import { ExtentModifier, LevelModifier } from './types.js';
import { Variable } from './variable.js';

export type CacheValue = aas.Referable | PagedResult<aas.Referable | PackageDescription>;

@singleton()
export class HttpCache extends Cache<string, Map<string, CacheValue>> {
    public constructor(@inject(Variable) variable: Variable) {
        super(variable.CACHE_SIZE);
    }

    public getIdentifiable<TIdentifiable extends aas.Identifiable>(
        id: string,
        query: string,
    ): TIdentifiable | undefined {
        const value = this.getItem(id);
        if (!value) {
            return undefined;
        }

        return value.get(query) as TIdentifiable;
    }

    public setIdentifiable<TIdentifiable extends aas.Identifiable>(query: string, identifiable: TIdentifiable): void {
        let value = this.getItem(identifiable.id);
        if (!value) {
            value = new Map<string, CacheValue>();
            this.setItem(identifiable.id, value);
        }

        value.set(query, identifiable);
    }

    public getSubmodelElement(
        id: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
    ): aas.SubmodelElement | undefined {
        const value = this.getItem(id);
        if (!value) {
            return undefined;
        }

        const query = `?idShortPath=${idShortPath}&level=${level}&extent=${extent}`;
        return value.get(query) as aas.SubmodelElement;
    }

    public setSubmodelElement(
        id: string,
        idShortPath: string,
        level: LevelModifier,
        extent: ExtentModifier,
        submodelElement: aas.SubmodelElement,
    ): void {
        let value = this.getItem(id);
        if (!value) {
            value = new Map<string, CacheValue>();
            this.setItem(id, value);
        }

        const query = `?idShortPath=${idShortPath}&level=${level}&extent=${extent}`;
        value.set(query, submodelElement);
    }

    public getResult<TReferable extends aas.Referable | PackageDescription>(
        key: string,
        query: string,
    ): PagedResult<TReferable> | undefined {
        const value = this.getItem(key);
        if (!value) {
            return undefined;
        }

        return value.get(query) as PagedResult<TReferable>;
    }

    public setResult<TReferable extends aas.Referable | PackageDescription>(
        key: string,
        query: string,
        result: PagedResult<TReferable>,
    ): void {
        let value = this.getItem(key);
        if (!value) {
            value = new Map<string, CacheValue>();
            this.setItem(key, value);
        }

        value.set(query, result);
    }

    public remove(key: string): boolean {
        return this.removeItem(key);
    }
}
