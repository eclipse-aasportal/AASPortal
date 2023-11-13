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
    convertFromString
} from 'common';
import { AASResourceFactory } from '../packages/aas-resource-factory.js';

type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

interface Query {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

interface OrExpression {
    andExpressions: string[];
}

interface Expression {
    orExpressions: OrExpression[]
}

export class AASFilter {
    private readonly expression: Expression;

    constructor(private readonly resourceFactory: AASResourceFactory,
        searchText: string, private readonly language: string) {
        this.expression = { orExpressions: this.splitOr(searchText) };
    }

    public async do(input: AASDocument): Promise<boolean> {
        let result = false;
        try {
            for (const or of this.expression.orExpressions) {
                for (const expression of or.andExpressions) {
                    if (expression.length >= 3) {
                        if (expression.startsWith('#')) {
                            if (!input.content) {
                                input.content = await this.getContentAsync(input)
                            }
                            
                            result = this.match(input, this.parseExpression(expression));
                        } else {
                            result = this.contains(input, expression);
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

    private async getContentAsync(document: AASDocument): Promise<aas.Environment> {
        const source = this.resourceFactory.create(document.endpoint);
        try {
            await source.openAsync();
            return await source.createPackage(document.address).readEnvironmentAsync();
        } finally {
            await source.closeAsync();
        }
    }

    private contains(document: AASDocument, expression: string): boolean {
        return document.idShort.toLocaleLowerCase(this.language).indexOf(expression) >= 0 ||
            document.id.toLocaleLowerCase(this.language).indexOf(expression) >= 0;
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

    private match(document: AASDocument, query: Query | undefined): boolean {
        if (query && document.content) {
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