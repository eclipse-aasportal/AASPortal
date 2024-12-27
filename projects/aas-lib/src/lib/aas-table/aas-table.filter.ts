/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { normalize } from '../convert';
import {
    AASDocument,
    aas,
    QueryParser,
    OrExpression,
    AASQuery,
    AASQueryValueType,
    AASQueryOperator,
    BaseValueType,
    isProperty,
    parseNumber,
    baseType,
    parseDate,
    toBoolean,
    flat,
    getModelTypeFromAbbreviation,
    AASAbbreviation,
} from 'aas-core';

export type ElementValueType = 'string' | 'boolean' | 'number' | 'Date' | 'bigint';

export class AASTableFilter {
    private readonly queryParser: QueryParser;

    public constructor(
        expression: string,
        private readonly language: string,
    ) {
        this.queryParser = new QueryParser(expression, language);
    }

    public match(document: AASDocument): boolean {
        try {
            const env = document.content;
            if (!env) {
                return false;
            }

            return this.evaluate(this.queryParser.ast, document, [...this.traverseEnvironment(env)]);
        } catch {
            return false;
        }
    }

    private *traverseEnvironment(env: aas.Environment): Iterable<aas.Referable> {
        for (const submodel of env.submodels) {
            for (const referable of flat(submodel)) {
                yield referable;
            }
        }
    }

    private evaluate(expression: OrExpression[], document: AASDocument, elements: aas.Referable[]): boolean {
        let result = false;
        for (const or of expression) {
            for (const and of or.andExpressions) {
                if (this.isText(and)) {
                    result = this.contains(document, and);
                } else if (this.isExpression(and)) {
                    result = this.evaluate(and, document, elements);
                } else {
                    result = this.matchElements(elements, and);
                }

                if (!result) {
                    break;
                }
            }

            if (result) {
                break;
            }
        }

        return result;
    }

    private isText(value: unknown): value is string {
        return typeof value === 'string';
    }

    private isExpression(value: unknown): value is OrExpression[] {
        return Array.isArray(value);
    }

    private contains(document: AASDocument, value: string): boolean {
        value = value.toLocaleLowerCase(this.language);
        return (
            document.idShort.toLocaleLowerCase(this.language).indexOf(value) >= 0 ||
            document.id.toLocaleLowerCase(this.language).indexOf(value) >= 0 ||
            document.endpoint.toLocaleLowerCase(this.language).indexOf(value) >= 0
        );
    }

    private matchElements(elements: aas.Referable[], query: AASQuery | undefined): boolean {
        if (query) {
            if (elements.some(element => this.any(element, query))) {
                return true;
            }
        }

        return false;
    }

    private any(element: aas.Referable, query: AASQuery): boolean {
        if (element.modelType === getModelTypeFromAbbreviation(query.modelType as AASAbbreviation)) {
            if (this.containsString(element.idShort, query.name)) {
                if (!element || !query.value) {
                    return true;
                }

                if (this.matchElement(element, query.value, query.operator)) {
                    return true;
                }
            }
        }

        return false;
    }

    private matchElement(element: aas.Referable, value: AASQueryValueType, operator?: AASQueryOperator): boolean {
        switch (element.modelType) {
            case 'Property':
                return this.matchProperty(element, value, operator);
            case 'File': {
                const { value } = this.getValueType(element);
                const fileName = normalize(value ?? '');
                return typeof value === 'string' && fileName ? this.containsString(fileName, value) : false;
            }
            default: {
                const { value } = this.getValueType(element);
                return typeof value === 'string' && value ? this.containsString(value, value) : false;
            }
        }
    }

    private matchProperty(element: aas.Referable, b: AASQueryValueType, operator: AASQueryOperator = '='): boolean {
        const { value, valueType } = this.getValueType(element);
        if (!value || !valueType) {
            return false;
        }

        const a = this.parse(value, valueType);
        if (typeof a === 'boolean') {
            return typeof b === 'boolean' ? a === b : false;
        }

        if (typeof a === 'string') {
            return typeof b === 'string' ? this.containsString(a, b) : false;
        }

        if (typeof a === 'number') {
            return this.matchNumber(a, b, operator);
        }

        if (typeof a === 'bigint') {
            return this.matchBigInt(a, b, operator);
        }

        if (a instanceof Date) {
            return this.matchDate(a, b, operator);
        }

        return false;
    }

    private containsString(a: string, b?: string): boolean {
        return b == null || a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
    }

    private matchNumber(a: number, b: AASQueryValueType, operator: AASQueryOperator): boolean {
        if (typeof b === 'number') {
            switch (operator) {
                case '<':
                    return a < b;
                case '>':
                    return a > b;
                case '>=':
                    return a >= b;
                case '<=':
                    return a <= b;
                case '!=':
                    return Math.abs(a - b) > 0.000001;
                default:
                    return Math.abs(a - b) <= 0.000001;
            }
        } else if (Array.isArray(b)) {
            return b.length === 2 && typeof b[0] === 'number' && typeof b[1] === 'number'
                ? a >= b[0] && a <= b[1]
                : false;
        }

        return false;
    }

    private matchBigInt(a: bigint, b: AASQueryValueType, operator: AASQueryOperator): boolean {
        if (typeof b === 'bigint') {
            switch (operator) {
                case '<':
                    return a < b;
                case '>':
                    return a > b;
                case '>=':
                    return a >= b;
                case '<=':
                    return a <= b;
                case '!=':
                    return a !== b;
                default:
                    return a === b;
            }
        } else if (Array.isArray(b)) {
            return b.length === 2 && typeof b[0] === 'bigint' && typeof b[1] === 'bigint'
                ? a >= b[0] && a <= b[1]
                : false;
        }

        return false;
    }

    private matchDate(a: Date, b: AASQueryValueType, operator: AASQueryOperator): boolean {
        if (b instanceof Date) {
            switch (operator) {
                case '<':
                    return a.getTime() < b.getTime();
                case '>':
                    return a.getTime() > b.getTime();
                case '>=':
                    return a.getTime() >= b.getTime();
                case '<=':
                    return a.getTime() <= b.getTime();
                case '!=':
                    return a.getTime() !== b.getTime();
                default:
                    return a.getTime() === b.getTime();
            }
        } else if (Array.isArray(b)) {
            return b.length === 2 && b[0] instanceof Date && b[1] instanceof Date
                ? a.getTime() >= b[0].getTime() && a.getTime() <= b[1].getTime()
                : false;
        }

        return false;
    }

    private parse(s: string, valueType: ElementValueType): BaseValueType {
        switch (valueType) {
            case 'string':
                return s;
            case 'number':
                return Number(s);
            case 'boolean':
                return Boolean(s);
            case 'bigint':
                return BigInt(s);
            case 'Date':
                return Date.parse(s);
        }
    }

    private getValueType(referable: aas.Referable): { valueType: ElementValueType; value: string } {
        let value: BaseValueType | undefined = this.toStringValue(referable);
        if (value) {
            return { valueType: 'string', value: value };
        }

        value = this.toNumberValue(referable);
        if (value) {
            return { valueType: 'number', value: value.toString() };
        }

        value = this.toBooleanValue(referable);
        if (value) {
            return { valueType: 'boolean', value: value.toString() };
        }

        value = this.toBigintValue(referable);
        if (value) {
            return { valueType: 'bigint', value: value.toString() };
        }

        value = this.toDateValue(referable);
        if (value) {
            return { valueType: 'Date', value: value.toISOString() };
        }

        throw new Error('Invalid operation.');
    }

    private toStringValue(referable: aas.Referable): string | undefined {
        switch (referable.modelType) {
            case 'Property': {
                const property = referable as aas.Property;
                if (baseType(property.valueType) === 'string') {
                    return property.value;
                }

                return undefined;
            }
            case 'MultiLanguageProperty':
                return (referable as aas.MultiLanguageProperty).value?.map(item => item.text).join(' ');
            case 'File':
                return (referable as aas.File).value;
            case 'Blob':
                return (referable as aas.Blob).contentType;
            case 'Range':
            case 'ReferenceElement':
            default:
                return undefined;
        }
    }

    private toNumberValue(referable: aas.Referable): number | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'number') {
            return parseNumber(referable.value);
        }

        return undefined;
    }

    private toDateValue(referable: aas.Referable): Date | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'Date') {
            return parseDate(referable.value);
        }

        return undefined;
    }

    private toBooleanValue(referable: aas.Referable): boolean | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'boolean') {
            return toBoolean(referable.value);
        }

        return undefined;
    }

    private toBigintValue(referable: aas.Referable): bigint | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'bigint') {
            return BigInt(referable.value);
        }

        return undefined;
    }
}
