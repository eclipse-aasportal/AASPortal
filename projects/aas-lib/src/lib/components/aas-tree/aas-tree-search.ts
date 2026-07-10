/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import trim from 'lodash-es/trim';
import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASAbbreviation,
    convertFromString,
    convertToString,
    getModelTypeFromAbbreviation,
    normalize,
    parseDate,
    parseNumber,
} from 'aas-core';

import { TreeNode } from '../tree/tree.component';

type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

interface SearchQuery {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

interface SearchTerm {
    text?: string;
    query?: SearchQuery;
}

/**
 * Provides a service to find elements of an AAS document that match a search expression.
 */
@Injectable()
export class AASTreeSearch {
    private readonly translate = inject(TranslateService);
    private readonly loop = true;
    private terms: SearchTerm[] = [];
    private matchIndex$ = signal(-1);
    private nodes: TreeNode[] = [];

    private readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');

    /** Marks a hit if the value is greater or equal to zero. */
    public readonly matchIndex = this.matchIndex$.asReadonly();

    /**
     * Starts the search for nodes that match the specified search expression.
     * @param nodes The nodes to be searched for.
     * @param value The search expression.
     */
    public start(nodes: TreeNode[], value: string | undefined): void {
        this.nodes = nodes;

        if (!value) {
            return;
        }

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
                    term.text = expression.toLocaleLowerCase(this.currentLang());
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
            this.matchIndex$.set(-1);
        }
    }

    /**
     * Searches for the next node that matches the search expression.
     * @returns `true` if all nodes have been searched once; otherwise `false`.
     */
    public findNext(): boolean {
        let completed = false;
        if (this.nodes.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = this.matchIndex$() < 0 ? 0 : this.matchIndex$() + 1;
            if (i >= this.nodes.length) {
                i = 0;
            }

            const start = i;
            while (this.loop) {
                if (this.match(this.nodes[i])) {
                    match = true;
                    break;
                }

                if (++i >= this.nodes.length) {
                    i = 0;
                    completed = true;
                }

                if (i === start) {
                    break;
                }
            }

            this.matchIndex$.set(match ? i : -1);
        }

        return completed;
    }

    /**
     * Searches for the previous node that corresponds to the search expression.
     * @returns `true` if all nodes have been searched once; otherwise `false`.
     */
    public findPrevious(): boolean {
        let completed = false;
        if (this.nodes.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = this.matchIndex$() <= 0 ? this.nodes.length - 1 : this.matchIndex$() - 1;
            const start = i;
            while (this.loop) {
                if (this.match(this.nodes[i])) {
                    match = true;
                    break;
                }

                if (--i <= 0) {
                    i = this.nodes.length - 1;
                    completed = true;
                }

                if (i === start) {
                    break;
                }
            }

            this.matchIndex$.set(match ? i : -1);
        }

        return completed;
    }

    private splitOr(s: string): string[] {
        return s.split('||').map(item => item.trim());
    }

    private findFirst(): void {
        if (this.nodes.length > 0 && this.terms.length > 0) {
            let match = false;
            let i = this.matchIndex$() < 0 ? 0 : this.matchIndex$();
            const start = i;
            while (this.loop) {
                if (this.match(this.nodes[i])) {
                    match = true;
                    break;
                }

                if (++i >= this.nodes.length) {
                    i = 0;
                }

                if (i === start) {
                    break;
                }
            }

            this.matchIndex$.set(match ? i : -1);
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

    private match(node: TreeNode): boolean {
        let match = false;
        const element = node.id as aas.Referable;
        if (!element) {
            return false;
        }

        for (const term of this.terms) {
            if (term.query) {
                if (element.modelType === term.query.modelType) {
                    if (term.query.name) {
                        if (this.containsString(node.name, term.query.name)) {
                            if (term.query.value) {
                                match = this.matchValue(element, term.query.value, term.query.operator);
                            } else {
                                match = true;
                            }
                        }
                    } else if (term.query.value) {
                        match = this.matchValue(element, term.query.value, term.query.operator);
                    } else {
                        match = true;
                    }
                }
            } else if (term.text) {
                match =
                    node.name.toLocaleLowerCase(this.currentLang()).indexOf(term.text) >= 0 ||
                    this.contains(element, term.text);
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
                        min = parseDate(b.substring(0, index).trim(), this.currentLang())?.getTime() ?? 0;
                        max = parseDate(b.substring(index + 3).trim(), this.currentLang())?.getTime() ?? 0;
                    } else {
                        min = parseNumber(b.substring(0, index).trim(), this.currentLang());
                        max = parseNumber(b.substring(index + 3).trim(), this.currentLang());
                    }

                    return typeof min === 'number' && typeof max === 'number' && a >= min && a <= max;
                } else {
                    const d = isDate
                        ? (parseDate(b, this.currentLang())?.getTime() ?? 0)
                        : parseNumber(b, this.currentLang());

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
            this.containsString(convertToString(a), b) || this.containsString(convertToString(a, this.currentLang()), b)
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
