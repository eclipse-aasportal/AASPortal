/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { trim, noop } from 'lodash-es';
import { normalize } from 'path';
import {
    AASDocument,
    getModelTypeFromAbbreviation,
    AASAbbreviation,
    convertToString,
    aas,
    parseDate,
    parseNumber,
    convertFromString,
    toBoolean
} from 'common';

import { LowDbDocument, LowDbElement } from './lowdb-types.js';

type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

interface Query {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string;
}

interface OrExpression {
    andExpressions: string[];
}

interface Expression {
    orExpressions: OrExpression[]
}

export class LowDbQuery {
    private readonly expression: Expression;

    constructor(
        searchText: string,
        private readonly language: string
    ) {
        this.expression = { orExpressions: this.splitOr(searchText) };
    }

    public do(document: LowDbDocument, elements: LowDbElement[]): boolean {
        let result = false;
        try {
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
        } catch (error) {
            noop();
        }

        return result;
    }

    private splitOr(s: string): OrExpression[] {
        return s.split('||').map(item => ({ andExpressions: this.splitAnd(item) }));
    }

    private splitAnd(s: string): string[] {
        return s.split('&&').map(item => item.trim().toLocaleLowerCase(this.language));
    }

    private contains(document: AASDocument, expression: string): boolean {
        return document.idShort.toLocaleLowerCase(this.language).indexOf(expression) >= 0 ||
            document.id.toLocaleLowerCase(this.language).indexOf(expression) >= 0 ||
            document.endpoint.toLocaleLowerCase(this.language).indexOf(expression) >= 0;
    }

    private parseExpression(expression: string): Query | undefined {
        let query: Query | undefined;
        const index = expression.indexOf(':');
        const tuple = this.parseOperator(expression);
        if (index >= 0) {
            const modelType = getModelTypeFromAbbreviation(expression.substring(1, index) as AASAbbreviation);
            if (modelType) {
                query = { modelType: modelType };
                if (tuple) {
                    query.name = expression.substring(index + 1, tuple.index).trim();
                    query.value = this.trim(expression.substring(tuple.index + tuple.operator.length));
                    query.operator = tuple.operator;
                } else {
                    query.name = expression.substring(index + 1);
                }
            }
        } else if (tuple) {
            const modelType = getModelTypeFromAbbreviation(expression.substring(1, tuple.index) as AASAbbreviation);
            if (modelType) {
                query = { modelType: modelType };
                query.value = this.trim(expression.substring(tuple.index + tuple.operator.length));
                query.operator = tuple.operator;
            }
        } else {
            const modelType = getModelTypeFromAbbreviation(expression.substring(1) as AASAbbreviation);
            if (modelType) {
                query = { modelType: modelType };
            }
        }

        return query;
    }

    private parseOperator(expression: string): { index: number, operator: Operator } | undefined {
        let index = expression.indexOf('<=');
        if (index > 0) {
            return { index: index, operator: '<=' };
        }

        index = expression.indexOf('>=');
        if (index > 0) {
            return { index: index, operator: '>=' };
        }

        index = expression.indexOf('!=');
        if (index > 0) {
            return { index: index, operator: '!=' };
        }

        index = expression.indexOf('=');
        if (index > 0) {
            return { index, operator: '=' };
        }

        index = expression.indexOf('>');
        if (index > 0) {
            return { index, operator: '>' };
        }

        index = expression.indexOf('<');
        if (index > 0) {
            return { index, operator: '<' };
        }

        return undefined
    }

    private trim(s: string): string {
        return trim(s.trim(), '\'"');
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

                if (this.matchValue(element, query.value, query.operator)) {
                    return true;
                }
            }
        }

        return false;
    }

    private matchValue(element: LowDbElement, value: string, operator?: Operator): boolean {
        switch (element.modelType) {
            case 'Property':
                if (!element.value || !element.valueType) {
                    return false;
                }

                return this.matchProperty(element.value, element.valueType, value, operator);
            case 'File': {
                const fileName = normalize(element.value ?? '');
                return fileName ? this.containsString(fileName, value) : false;
            }
            default:
                return element.value ? this.containsString(element.value, value): false;
        }
    }

    private matchProperty(value: string, valueType: aas.DataTypeDefXsd, b: string, operator: Operator = '='): boolean {
        const a = convertFromString(value, valueType);
        if (valueType === 'xs:boolean') {
            return toBoolean(a) === toBoolean(b);
        }

        if (typeof a === 'number') {
            if (typeof b === 'string') {
                const index = b.indexOf('...');
                const isDate = this.isDate(valueType);
                if (index >= 0) {
                    let min: number;
                    let max: number;
                    if (isDate) {
                        min = parseDate(b.substring(0, index).trim(), this.language)?.getTime() ?? 0;
                        max = parseDate(b.substring(index + 3).trim(), this.language)?.getTime() ?? 0;
                    } else {
                        min = parseNumber(b.substring(0, index).trim(), this.language);
                        max = parseNumber(b.substring(index + 3).trim(), this.language);
                    }

                    return typeof min === 'number' && typeof max === 'number' && a >= min && a <= max;
                } else {
                    const d = isDate
                        ? parseDate(b, this.language)?.getTime() ?? 0
                        : parseNumber(b, this.language);

                    if (typeof d !== 'number') {
                        return false;
                    }

                    switch (operator) {
                        case '<':
                            return a < d;
                        case '>':
                            return a > d;
                        case '>=':
                            return a >= d;
                        case '<=':
                            return a <= d;
                        case '!=':
                            return Math.abs(a - d) > 0.000001;
                        default:
                            return Math.abs(a - d) <= 0.000001;
                    }
                }
            }

            return false;
        }

        return this.containsString(convertToString(a), b) ||
            this.containsString(convertToString(a, this.language), b);
    }

    private containsString(a: string, b?: string): boolean {
        return b == null || a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
    }

    private isDate(valueType: aas.DataTypeDefXsd): boolean {
        switch (valueType) {
            case 'xs:date':
            case 'xs:dateTime':
                return true;
            default:
                return false;
        }
    }
}