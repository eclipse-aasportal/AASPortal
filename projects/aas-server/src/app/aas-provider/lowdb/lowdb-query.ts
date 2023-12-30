/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { normalize } from 'path';
import { AASDocument } from 'common';

import { LowDbDocument, LowDbElement, LowDbElementValueType } from './lowdb-types.js';
import { QueryOperator, Query, BaseValueType, AASIndexQuery, QueryValueType } from '../aas-index-query.js';

export class LowDbQuery extends AASIndexQuery {

    constructor(query: string, language: string) {
        super(query, language);
    }

    public do(document: LowDbDocument, elements: LowDbElement[]): boolean {
        try {
            let result = false;
            for (const or of this.expression.orExpressions) {
                for (const expression of or.andExpressions) {
                    if (expression.length >= 3) {
                        if (expression.startsWith('#')) {
                            result = this.match(elements, this.parseExpression(expression));
                        } else {
                            result = this.contains(document, expression);
                        }
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
        } catch (error) {
            return false;
        }
    }

    private contains(document: AASDocument, expression: string): boolean {
        return document.idShort.toLocaleLowerCase(this.language).indexOf(expression) >= 0 ||
            document.id.toLocaleLowerCase(this.language).indexOf(expression) >= 0 ||
            document.endpoint.toLocaleLowerCase(this.language).indexOf(expression) >= 0;
    }

    private match(elements: LowDbElement[], query: Query | undefined): boolean {
        if (query) {
            if (elements.some(element => this.any(element, query))) {
                return true;
            }
        }

        return false;
    }

    private any(element: LowDbElement, query: Query): boolean {
        if (element.modelType === query.modelType) {
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

    private matchElement(element: LowDbElement, value: QueryValueType, operator?: QueryOperator): boolean {
        switch (element.modelType) {
            case 'prop':
                return this.matchProperty(element, value, operator);
            case 'file': {
                const fileName = normalize(element.value ?? '');
                return typeof value === 'string' && fileName ? this.containsString(fileName, value) : false;
            }
            default:
                return typeof value === 'string' && element.value ? this.containsString(element.value, value) : false;
        }
    }

    private matchProperty(element: LowDbElement, b: QueryValueType, operator: QueryOperator = '='): boolean {
        if (!element.value || !element.valueType) {
            return false;
        }

        const a = this.parse(element.value, element.valueType);
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

    private matchNumber(a: number, b: QueryValueType, operator: QueryOperator): boolean {
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
            return (b.length === 2 && typeof b[0] === 'number' && typeof b[1] === 'number')
                ? a >= b[0] && a <= b[1]
                : false;
        }

        return false;
    }

    private matchBigInt(a: bigint, b: QueryValueType, operator: QueryOperator): boolean {
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
            return (b.length === 2 && typeof b[0] === 'bigint' && typeof b[1] === 'bigint')
                ? a >= b[0] && a <= b[1]
                : false;
        }

        return false;
    }

    private matchDate(a: Date, b: QueryValueType, operator: QueryOperator): boolean {
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
            return (b.length === 2 && b[0] instanceof Date && b[1] instanceof Date)
                ? a.getTime() >= b[0].getTime() && a.getTime() <= b[1].getTime()
                : false;
        }

        return false;
    }

    private parse(s: string, valueType: LowDbElementValueType): BaseValueType {
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
}