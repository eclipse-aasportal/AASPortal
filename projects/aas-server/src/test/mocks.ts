/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, Mocked, vitest } from 'vitest';
import { nanoid } from 'nanoid';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { aas, jsonization } from 'aas-core';
import { Database } from '../app/db/database.js';
import { Variable } from '../app/variable.js';
import { LangString } from 'projects/aas-core/dist/types/aas.js';

type Func = () => any;

export type SpyObjMethodNames<T = undefined> = T extends undefined
    ? ReadonlyArray<string> | { [methodName: string]: any }
    : ReadonlyArray<keyof T> | { [P in keyof T]?: T[P] extends Func ? ReturnType<T[P]> : any };

export type SpyObjPropertyNames<T = undefined> = T extends undefined
    ? ReadonlyArray<string> | { [propertyName: string]: any }
    : ReadonlyArray<keyof T> | { [P in keyof T]?: T[P] };

export function createSpyObj<T extends object>(
    methodNames: SpyObjMethodNames<T>,
    propertyNames?: SpyObjPropertyNames<T>,
): Mocked<T> {
    const obj: { [key: string]: unknown } = {};
    if (Array.isArray(methodNames)) {
        for (const methodName of methodNames) {
            obj[methodName as string] = vitest.fn();
        }
    } else {
        for (const methodName in methodNames) {
            obj[methodName] = vitest.fn();
        }
    }

    if (propertyNames) {
        if (Array.isArray(propertyNames)) {
            for (const propertyName of propertyNames) {
                obj[propertyName] = propertyNames[propertyName];
            }
        } else {
            for (const propertyName in propertyNames) {
                obj[propertyName] = propertyNames[propertyName];
            }
        }
    }

    return obj as Mocked<T>;
}

export async function createDatabase(): Promise<Database> {
    const tmpDir = fileURLToPath(new URL(`./assets/tmp/${nanoid()}`, import.meta.url));
    if (fs.existsSync(tmpDir)) {
        await fs.promises.rm(tmpDir, { recursive: true });
    }

    await fs.promises.cp(fileURLToPath(new URL(`./assets/data`, import.meta.url)), tmpDir, { recursive: true });
    const db = new Database(createSpyObj<Variable>({}, { DATA: tmpDir, PAGE_SIZE: 100 }));
    await db.ready();
    return db;
}

export const mockProperty = (value: any, valueType: aas.DataTypeDefXsd): aas.Property => ({
    modelType: 'Property',
    value,
    valueType,
} as aas.Property);

export const mockFile = (contentType: string, value: string): aas.File => ({
    modelType: 'File',
    contentType,
    value,
} as aas.File);

export const mockMultiLanguageProperty = (value: LangString[]): aas.MultiLanguageProperty => ({
    modelType: 'MultiLanguageProperty',
    value,
} as aas.MultiLanguageProperty);

export const mockBlob = (contentType: string, value: string): aas.Blob => ({
    modelType: 'Blob',
    contentType,
    value,
} as aas.Blob);

export const mockRange = (min: any, max: any, valueType: aas.DataTypeDefXsd): aas.Range => ({
    modelType: 'Range',
    min,
    max,
    valueType,
} as aas.Range);

export const mockReference = (type: aas.ReferenceTypes, keys: aas.Key[]): aas.Reference => ({
    type,
    keys,
} as aas.Reference);

export const mockReferenceElement = (reference: any): aas.ReferenceElement => ({
    modelType: 'ReferenceElement',
    value: reference,
} as aas.ReferenceElement);

export const mockRelationshipElement = (first: any, second: any): aas.RelationshipElement => ({
    modelType: 'RelationshipElement',
    first,
    second,
} as aas.RelationshipElement);

export const mockBasicEventElement = (observed: any): aas.BasicEventElement => ({
    modelType: 'BasicEventElement',
    observed,
} as aas.BasicEventElement);

export const mockSubmodelElementCollection = (children: any[]): aas.SubmodelElementCollection => ({
    modelType: 'SubmodelElementCollection',
    value: children,
} as aas.SubmodelElementCollection);

export const mockSubmodelElementList = (children: any[]): aas.SubmodelElementList => ({
    modelType: 'SubmodelElementList',
    value: children,
} as aas.SubmodelElementList);

export const mockEntity = (entityType: string, globalAssetId: string, statements: any[]): aas.Entity => ({
    modelType: 'Entity',
    entityType,
    globalAssetId,
    statements,
} as aas.Entity);

export const mockAnnotatedRelationshipElement = (first: any, second: any, annotations: any[]): aas.AnnotatedRelationshipElement => ({
    modelType: 'AnnotatedRelationshipElement',
    first,
    second,
    annotations,
} as aas.AnnotatedRelationshipElement);
