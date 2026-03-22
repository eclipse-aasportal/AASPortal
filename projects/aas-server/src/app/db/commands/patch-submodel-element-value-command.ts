/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError, jsonization, toSubmodel, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { SubmodelTable } from '../submodel-table.js';
import { selectISubmodelElement, serializeValue } from '../../utilities.js';
import { ERROR } from '../../error.js';

export class PatchSubmodelElementValueCommand extends DatabaseCommand {
    private readonly table: SubmodelTable;

    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly id: string,
        private readonly idShortPath: string,
        private readonly value: jsonization.JsonValue,
    ) {
        super(database, resolve, reject);

        this.table = this.database.submodels;
    }

    public override async execute(): Promise<void> {
        const key = await this.database.submodels.getKey(this.id);
        const submodel = await this.table.readSubmodel(key);
        const element = selectISubmodelElement(submodel, this.idShortPath);
        if (!element) {
            throw new ApplicationError(
                ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                { id: this.id, idShortPath: this.idShortPath },
                404,
            );
        }

        this.patchValue(element, this.value, this.idShortPath);

        await this.table.writeObject(toSubmodel(submodel), key);
    }

    private patchValue(element: types.ISubmodelElement, value: jsonization.JsonValue, idShortPath: string): void {
        if (element instanceof types.Property) {
            this.patchProperty(element, value);
        } else if (this.isJsonObject(value)) {
            if (element instanceof types.Range) {
                this.patchRange(element, value);
            } else if (element instanceof types.File) {
                this.patchFile(element, value);
            } else if (element instanceof types.ReferenceElement) {
                this.patchReferenceElement(element, value);
            } else if (element instanceof types.Blob) {
                this.patchBlob(element, value);
            } else if (element instanceof types.SubmodelElementCollection) {
                this.patchSubmodelElementCollection(element, value, idShortPath);
            } else if (element instanceof types.Entity) {
                this.patchEntity(element, value, idShortPath);
            } else if (element instanceof types.AnnotatedRelationshipElement) {
                this.patchAnnotatedRelationshipElement(element, value, idShortPath);
            } else if (element instanceof types.RelationshipElement) {
                this.patchRelationshipElement(element, value);
            } else if (element instanceof types.BasicEventElement) {
                this.patchBasicEventElement(element, value);
            }
        } else if (this.isJsonArray(value)) {
            if (element instanceof types.MultiLanguageProperty) {
                this.patchMultiLanguageProperty(element, value);
            } else if (element instanceof types.SubmodelElementList) {
                this.patchSubmodelElementList(element, value, idShortPath);
            }
        }
    }

    private patchProperty(element: types.Property, value: jsonization.JsonValue): void {
        element.value = serializeValue(value, element.valueType);
    }

    private patchEntity(element: types.Entity, value: jsonization.JsonObject, idShortPath: string): void {
        if (this.isJsonObject(value)) {
            if (Object.hasOwn(value, 'entityType')) {
                if (typeof value.entityType !== 'string') {
                    throw new ApplicationError(
                        ERROR.INVALID_VALUE_TYPE,
                        { expected: 'string', actual: typeof value.entityType },
                        400,
                    );
                }

                element.entityType = types.EntityType[value.entityType as keyof typeof types.EntityType];
            }

            if (Object.hasOwn(value, 'globalAssetId')) {
                if (typeof value.globalAssetId === 'string') {
                    element.globalAssetId = value.globalAssetId;
                } else {
                    throw new ApplicationError(
                        ERROR.INVALID_VALUE_TYPE,
                        { expected: 'string', actual: typeof value.globalAssetId },
                        400,
                    );
                }
            }

            for (const name in value) {
                const childElement = element.statements?.find(e => e.idShort === name);
                if (!childElement) {
                    throw new ApplicationError(
                        ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                        { id: this.id, idShortPath: `${idShortPath}.${name}` },
                        404,
                    );
                }

                this.patchValue(childElement, value[name], `${idShortPath}.${name}`);
            }
        }
    }

    private patchAnnotatedRelationshipElement(
        element: types.AnnotatedRelationshipElement,
        value: jsonization.JsonObject,
        idShortPath: string,
    ): void {
        this.patchRelationshipElement(element, value);

        if (Object.hasOwn(value, 'annotations')) {
            if (!this.isJsonObject(value.annotations)) {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'JsonObject', actual: typeof value },
                    400,
                );
            }

            for (const name in value.annotations) {
                const childElement = element.annotations?.find(e => e.idShort === name);
                if (!childElement) {
                    throw new ApplicationError(
                        ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                        { id: this.id, idShortPath: `${idShortPath}.${name}` },
                        404,
                    );
                }

                this.patchValue(childElement, value[name], `${idShortPath}.${name}`);
            }
        }
    }

    private patchRelationshipElement(element: types.RelationshipElement, value: jsonization.JsonObject): void {
        if (Object.hasOwn(value, 'first')) {
            if (!this.isJsonObject(value.first)) {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'JsonObject', actual: typeof value.first },
                    400,
                );
            }

            element.first = this.createReferenceFromValue(value.first);
        }

        if (Object.hasOwn(value, 'second')) {
            if (!this.isJsonObject(value.second)) {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'JsonObject', actual: typeof value.second },
                    400,
                );
            }

            element.second = this.createReferenceFromValue(value.second);
        }
    }

    private patchBasicEventElement(element: types.BasicEventElement, value: jsonization.JsonObject): void {
        if (Object.hasOwn(value, 'observed')) {
            if (!this.isJsonObject(value.observed)) {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'JsonObject', actual: typeof value.observed },
                    400,
                );
            }

            element.observed = this.createReferenceFromValue(value.observed);
        }
    }

    private patchBlob(element: types.Blob, value: jsonization.JsonObject): void {
        if (!Object.hasOwn(value, 'contentType')) {
            throw new ApplicationError(ERROR.PROPERTY_EXPECTED, { modelType: 'Blob', expected: 'contentType' }, 400);
        }

        if (typeof value.contentType !== 'string') {
            throw new ApplicationError(
                ERROR.INVALID_VALUE_TYPE,
                { expected: 'string', actual: typeof value.contentType },
                400,
            );
        }

        element.contentType = value.contentType;

        if (Object.hasOwn(value, 'value')) {
            if (typeof value.value !== 'string') {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'string', actual: typeof value.value },
                    400,
                );
            }

            element.value = new TextEncoder().encode(value.value);
        }
    }

    private patchReferenceElement(element: types.ReferenceElement, value: jsonization.JsonObject): void {
        element.value = this.createReferenceFromValue(value);
    }

    private patchFile(element: types.File, value: jsonization.JsonObject): void {
        if (!Object.hasOwn(value, 'contentType')) {
            throw new ApplicationError(ERROR.PROPERTY_EXPECTED, { modelType: 'File', expected: 'contentType' }, 400);
        }

        if (typeof value.contentType !== 'string') {
            throw new ApplicationError(
                ERROR.INVALID_VALUE_TYPE,
                { expected: 'string', actual: typeof value.contentType },
                400,
            );
        }

        element.contentType = value.contentType;

        if (Object.hasOwn(value, 'value')) {
            if (typeof value.value !== 'string') {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    { expected: 'string', actual: typeof value.value },
                    400,
                );
            }

            element.value = value.value;
        }
    }

    private patchMultiLanguageProperty(element: types.MultiLanguageProperty, value: jsonization.JsonArray): void {
        if (!Array.isArray(value)) {
            throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'Array', actual: typeof value }, 400);
        }

        element.value = this.createLangStringTextTypeArray(value as jsonization.JsonValue[]);
    }

    private patchRange(element: types.Range, value: jsonization.JsonObject): void {
        if (this.isJsonObject(value) && (Object.hasOwn(value, 'min') || Object.hasOwn(value, 'max'))) {
            element.min = serializeValue(value.min, element.valueType);
            element.max = serializeValue(value.max, element.valueType);
        } else {
            throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'JsonObject', actual: typeof value }, 400);
        }
    }

    private patchSubmodelElementCollection(
        element: types.SubmodelElementCollection,
        value: jsonization.JsonObject,
        idShortPath: string,
    ): void {
        if (this.isJsonObject(value)) {
            for (const name in value) {
                const childElement = element.value?.find(e => e.idShort === name);
                if (!childElement) {
                    throw new ApplicationError(
                        ERROR.SUBMODEL_ELEMENT_DOES_NOT_EXIST,
                        { id: this.id, idShortPath: `${idShortPath}.${name}` },
                        404,
                    );
                }

                this.patchValue(childElement, value[name], `${idShortPath}.${name}`);
            }
        }
    }

    private patchSubmodelElementList(
        element: types.SubmodelElementList,
        value: jsonization.JsonArray,
        idShortPath: string,
    ): void {
        const list = element.value ?? [];
        if (Array.isArray(value)) {
            if (value.length !== list.length) {
                throw new ApplicationError(
                    ERROR.INVALID_VALUE_TYPE,
                    {
                        expected: `Array of length ${list.length}`,
                        actual: `Array of length ${value.length}`,
                    },
                    400,
                );
            }

            for (let i = 0; i < value.length; i++) {
                this.patchValue(list[i], value[i], `${idShortPath}[${i}]`);
            }
        } else {
            throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'Array', actual: typeof value }, 400);
        }
    }

    private createReferenceFromValue(value: jsonization.JsonObject): types.Reference {
        return jsonization.referenceFromJsonable(value).mustValue();
    }

    private isJsonObject(value: unknown): value is jsonization.JsonObject {
        return typeof value === 'object' && !Array.isArray(value);
    }

    private isJsonArray(value: unknown): value is jsonization.JsonArray {
        return Array.isArray(value);
    }

    private createLangStringTextTypeArray(value: jsonization.JsonValue[]): types.LangStringTextType[] {
        return value.map(item => jsonization.langStringTextTypeFromJsonable(item).mustValue());
    }
}