/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { trim, noop } from 'lodash-es';
import { AASTableRow } from './aas-table.state';
import { TranslateService } from '@ngx-translate/core';
import { normalize } from '../convert';
import {
    AASDocument,
    getModelTypeFromAbbreviation,
    AASAbbreviation,
    convertToString,
    aas,
    parseDate,
    parseNumber,
    convertFromString
} from 'common';

type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

interface Query {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

export class AASTableFilter {
    constructor(private readonly translate: TranslateService) {
    }

    public do(input: AASTableRow[], searchText: string): AASTableRow[] {
        const output: AASTableRow[] = [];
        let start = false;
        try {
            const set = new Set<AASTableRow>();
            if (typeof searchText === 'string') {
                for (const or of this.splitOr(searchText)) {
                    let rows = [...input];
                    for (const and of this.splitAnd(or)) {
                        if (and.length >= 3) {
                            start = true;
                            const expression = and.toLocaleLowerCase(this.translate.currentLang);
                            if (expression.startsWith('#')) {
                                rows = [...this.where(rows, this.parseExpression(expression))];
                            } else {
                                rows = [...this.filter(rows, expression)];
                            }
                        }
                    }

                    for (const row of rows) {
                        if (!set.has(row)) {
                            output.push(row);
                            set.add(row);
                        }
                    }
                }
            }
        } catch (error) {
            noop();
        }

        return start ? output : input;
    }

    private splitOr(s: string): string[] {
        return s.split('||').map(item => item.trim());
    }

    private splitAnd(s: string): string[] {
        return s.split('&&').map(item => item.trim());
    }

    private *filter(rows: AASTableRow[], expression: string): Generator<AASTableRow> {
        for (const row of rows) {
            if (row.type.toLocaleLowerCase(this.translate.currentLang).indexOf(expression) >= 0 ||
                row.name.toLocaleLowerCase(this.translate.currentLang).indexOf(expression) >= 0 ||
                row.id.toLocaleLowerCase(this.translate.currentLang).indexOf(expression) >= 0) {
                yield row;
            }
        }
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
                    query.value = this.fromString(expression.substring(tuple.index + tuple.operator.length));
                    query.operator = tuple.operator;
                } else {
                    query.name = expression.substring(index + 1);
                }
            }
        } else if (tuple) {
            const modelType = getModelTypeFromAbbreviation(expression.substring(1, tuple.index) as AASAbbreviation);
            if (modelType) {
                query = { modelType: modelType };
                query.value = this.fromString(expression.substring(tuple.index + tuple.operator.length));
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

    private fromString(s: string): string | boolean {
        s = s.trim();
        switch (s.toLowerCase()) {
            case 'true':
                return true;
            case 'false':
                return false;
            default:
                return trim(s, '\'"');
        }
    }

    private *where(rows: AASTableRow[], query: Query | undefined): Generator<AASTableRow> {
        for (const row of rows) {
            if (!query || this.match(row.document, query)) {
                yield row;
            }
        }
    }

    private match(document: AASDocument, query: Query): boolean {
        if (document.content) {
            if (document.content.assetAdministrationShells.some(shell => this.any(shell, query))) {
                return true;
            }

            if (document.content.submodels.some(submodel => this.any(submodel, query))) {
                return true;
            }
        }

        return false;
    }

    private any(parent: aas.Referable, query: Query): boolean {
        if (parent.modelType === query.modelType) {
            if (this.containsString(parent.idShort, query.name)) {
                if (!parent || !query.value) {
                    return true;
                }

                if (this.matchValue(parent, query.value, query.operator)) {
                    return true;
                }
            }
        }

        for (const child of this.getChildren(parent)) {
            if (this.any(child, query)) {
                return true;
            }
        }

        return false;
    }

    private matchValue(referable: aas.Referable, value: string | boolean, operator?: Operator): boolean {
        switch (referable.modelType) {
            case 'Property':
                return this.matchProperty(referable as aas.Property, value, operator);
            case 'File': {
                const fileName = normalize((referable as aas.File).value ?? '');
                return fileName ? this.containsString(fileName, value as string) : false;
            }
            case 'Entity': {
                const entity = referable as aas.Entity;
                return entity.globalAssetId ? this.containsString(entity.globalAssetId, value as string) : false;
            }
            case 'ReferenceElement': {
                const referenceElement = referable as aas.ReferenceElement;
                return referenceElement.value.keys.some(key => this.containsString(key.value, value as string));
            }
            case 'MultiLanguageProperty': {
                const langString = (referable as aas.MultiLanguageProperty).value;
                return langString ? langString.some(item => item ? this.containsString(item.text, value as string) : false) : false;
            }
            default:
                return false;
        }
    }

    private matchProperty(property: aas.Property, b: string | boolean, operator: Operator = '='): boolean {
        const a = convertFromString(property.value, property.valueType);
        if (typeof a === 'boolean') {
            return (typeof b === 'boolean') && a === b;
        } else if (typeof b === 'boolean') {
            return false;
        }

        if (typeof a === 'number') {
            if (typeof b === 'string') {
                const index = b.indexOf('...');
                const isDate = this.isDate(property.valueType);
                if (index >= 0) {
                    let min: number;
                    let max: number;
                    if (isDate) {
                        min = parseDate(b.substring(0, index).trim(), this.translate.currentLang)?.getTime() ?? 0;
                        max = parseDate(b.substring(index + 3).trim(), this.translate.currentLang)?.getTime() ?? 0;
                    } else {
                        min = parseNumber(b.substring(0, index).trim(), this.translate.currentLang);
                        max = parseNumber(b.substring(index + 3).trim(), this.translate.currentLang);
                    }

                    return typeof min === 'number' && typeof max === 'number' && a >= min && a <= max;
                } else {
                    const d = isDate
                        ? parseDate(b, this.translate.currentLang)?.getTime() ?? 0
                        : parseNumber(b, this.translate.currentLang);

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
            this.containsString(convertToString(a, this.translate.currentLang), b);
    }

    private containsString(a: string, b?: string): boolean {
        return b == null || a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
    }

    private getChildren(parent: aas.Referable): aas.Referable[] {
        switch (parent.modelType) {
            case 'Submodel':
                return (parent as aas.Submodel).submodelElements ?? [];
            case 'SubmodelElementCollection':
                return (parent as aas.SubmodelElementCollection).value ?? [];
            default:
                return [];
        }
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