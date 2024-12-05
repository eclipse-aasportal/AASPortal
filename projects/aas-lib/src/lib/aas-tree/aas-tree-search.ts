/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import trim from 'lodash-es/trim';
import { Injectable, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASAbbreviation,
    convertFromString,
    convertToString,
    getModelTypeFromAbbreviation,
    parseDate,
    parseNumber,
} from 'aas-core';

import { normalize } from '../convert';
import { AASTreeRow } from './aas-tree-row';
import { AASTreeStore } from './aas-tree.store';

export type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export interface SearchQuery {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

export interface SearchTerm {
    text?: string;
    query?: SearchQuery;
}

@Injectable()
export class AASTreeSearch {
    private readonly loop = true;
    private terms: SearchTerm[] = [];

    public constructor(
        private readonly store: AASTreeStore,
        private readonly translate: TranslateService,
    ) {}

    public find(referable: aas.Referable): void {
        const rows = untracked(this.store.state$).rows;
        const index = rows.findIndex(row => row.element === referable);
        if (index >= 0) {
            this.store.setMatchIndex(index);
        }
    }

    public start(value: string): void {
        if (!value) return;

        const terms: SearchTerm[] = [];
        for (const expression of this.splitOr(value)) {
            const term: SearchTerm = {};
            if (expression.length >= 3) {
                if (expression.startsWith('#')) {
                    const query = this.parseExpression(expression);
                    if (query) {
                        term.query = query;
                    }
                } else {
                    term.text = expression.toLocaleLowerCase(this.translate.currentLang);
                }
            }

            if (term.text || term.query) {
                terms.push(term);
            }
        }

        if (terms.length > 0) {
            this.terms = terms;
            this.findFirst();
        } else {
            this.store.setMatchIndex(-1);
        }
    }

    public findNext(): boolean {
        let completed = false;
        const state = untracked(this.store.state$);
        if (state.rows.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = state.matchIndex < 0 ? 0 : state.matchIndex + 1;
            if (i >= state.rows.length) {
                i = 0;
            }

            const start = i;
            while (this.loop) {
                if (this.match(state.rows[i])) {
                    match = true;
                    break;
                }

                if (++i >= state.rows.length) {
                    i = 0;
                    completed = true;
                }

                if (i === start) {
                    break;
                }
            }

            this.store.setMatchIndex(match ? i : -1);
        }

        return completed;
    }

    public findPrevious(): boolean {
        let completed = false;
        const state = untracked(this.store.state$);
        if (state.rows.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = state.matchIndex <= 0 ? state.rows.length - 1 : state.matchIndex - 1;
            const start = i;
            while (this.loop) {
                if (this.match(state.rows[i])) {
                    match = true;
                    break;
                }

                if (--i <= 0) {
                    i = state.rows.length - 1;
                    completed = true;
                }

                if (i === start) {
                    break;
                }
            }

            this.store.setMatchIndex(match ? i : -1);
        }

        return completed;
    }

    private splitOr(s: string): string[] {
        return s.split('||').map(item => item.trim());
    }

    private findFirst(): void {
        const state = untracked(this.store.state$);
        if (state.rows.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = state.matchIndex < 0 ? 0 : state.matchIndex;
            const start = i;
            while (this.loop) {
                if (this.match(state.rows[i])) {
                    match = true;
                    break;
                }

                if (++i >= state.rows.length) {
                    i = 0;
                }

                if (i === start) {
                    break;
                }
            }

            this.store.setMatchIndex(match ? i : -1);
        }
    }

    private parseExpression(expression: string): SearchQuery | null {
        let query: SearchQuery | null = null;
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

    private parseOperator(expression: string): { index: number; operator: Operator } | undefined {
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

        return undefined;
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

    private match(row: AASTreeRow): boolean {
        let match = false;
        for (const term of this.terms) {
            if (term.query) {
                if (row.element.modelType === term.query.modelType) {
                    if (term.query.name) {
                        if (this.containsString(row.name, term.query.name)) {
                            if (term.query.value) {
                                match = this.matchValue(row.element!, term.query.value, term.query.operator);
                            } else {
                                match = true;
                            }
                        }
                    } else if (term.query.value) {
                        match = this.matchValue(row.element!, term.query.value, term.query.operator);
                    } else {
                        match = true;
                    }
                }
            } else if (term.text) {
                match =
                    row.name.toLocaleLowerCase(this.translate.currentLang).indexOf(term.text) >= 0 ||
                    this.contains(row.element, term.text);
            }

            if (match) {
                break;
            }
        }

        return match;
    }

    private contains(referable: aas.Referable, text: string): boolean {
        const stack = [referable as unknown as { [key: string]: unknown }];
        while (stack.length > 0) {
            const obj = stack.pop();
            if (!obj) {
                break;
            }

            for (const name in obj) {
                if (name.indexOf(text) >= 0) {
                    return true;
                }

                const value = obj[name];
                if (typeof value === 'string') {
                    if (value.indexOf(text) >= 0) {
                        return true;
                    }
                } else if (typeof value === 'object') {
                    stack.push(value as { [key: string]: unknown });
                }
            }
        }

        return false;
    }

    private containsString(a: string, b?: string): boolean {
        return b == null || a.toLowerCase().indexOf(b.toLowerCase()) >= 0;
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
                if (!referenceElement.value) {
                    return false;
                }

                return referenceElement.value.keys.some(key => this.containsString(key.value, value as string));
            }
            case 'MultiLanguageProperty': {
                const langString = (referable as aas.MultiLanguageProperty).value;
                return langString
                    ? langString.some(item => (item ? this.containsString(item.text, value as string) : false))
                    : false;
            }
            default:
                return false;
        }
    }

    private matchProperty(property: aas.Property, b: string | boolean, operator: Operator = '='): boolean {
        const a = convertFromString(property.value, property.valueType);
        if (typeof a === 'boolean') {
            return typeof b === 'boolean' && a === b;
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
                        ? (parseDate(b, this.translate.currentLang)?.getTime() ?? 0)
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

        return (
            this.containsString(convertToString(a), b) ||
            this.containsString(convertToString(a, this.translate.currentLang), b)
        );
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
