/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASQuery, AASQueryOperator, OrExpression, FilterExpressionParser } from 'aas-core';

export interface AASIndexQuery {
    readonly joinElements: boolean;
    createSql(values: unknown[]): string;
}

export class SqlIndexQuery implements AASIndexQuery {
    private readonly queryParser: FilterExpressionParser;

    public constructor(expression: string, language: string = 'en') {
        this.queryParser = new FilterExpressionParser(expression, language);
    }

    public get joinElements(): boolean {
        return this.queryParser.hasAASQueries;
    }

    public createSql(values: unknown[]): string {
        return this.evaluate(this.queryParser.ast, values);
    }

    private evaluate(expression: OrExpression[], values: unknown[]): string {
        const orSqlTerms: string[] = [];
        for (const or of expression) {
            const andSqlTerms: string[] = [];
            for (const and of or.andExpressions) {
                if (this.isQuery(and)) {
                    andSqlTerms.push(this.createSqlTerm(and, values));
                } else if (this.isExpression(and)) {
                    andSqlTerms.push(`(${this.evaluate(and, values)})`);
                } else {
                    const pattern = and
                        .split(' ')
                        .filter(item => item.length > 0)
                        .join('|');

                    values.push(`%${and}%`);
                    values.push(`%${and}%`);
                    values.push(`%${and}%`);
                    values.push(`%${and}%`);
                    values.push(pattern);
                    values.push(pattern);
                    andSqlTerms.push(
                        `(documents.endpoint LIKE ? OR documents.id LIKE ? OR documents.idShort LIKE ? OR elements.idShort LIKE ? OR elements.id REGEXP ? OR elements.stringValue REGEXP ?)`,
                    );
                }
            }

            orSqlTerms.push(andSqlTerms.join(' AND '));
        }

        return orSqlTerms.join(' OR ');
    }

    private createSqlTerm(query: AASQuery, values: unknown[]): string {
        let s = `elements.modelType = '${query.modelType.toLowerCase()}'`;
        if (query.name) {
            values.push(`%${query.name}%`);
            s += ' AND elements.idShort LIKE ?';
        }

        if (query.value && query.operator) {
            if (this.isDate(query.value)) {
                s += this.createDateSqlTerm(query.operator, query.value, values);
            } else if (this.isNumber(query.value)) {
                s += this.createNumberSqlTerm(query.operator, query.value, values);
            } else if (this.isBigint(query.value)) {
                s += this.createBigintSqlTerm(query.operator, query.value, values);
            } else if (typeof query.value === 'boolean') {
                s += this.createBooleanSqlTerm(query.operator, query.value, values);
            } else {
                s += this.createStringSqlTerm(query.operator, query.value, values);
            }
        }

        return s;
    }

    private isDate(value: unknown): value is Date | [Date, Date] {
        return value instanceof Date || (Array.isArray(value) && value[0] instanceof Date);
    }

    private isNumber(value: unknown): value is number | [number, number] {
        return typeof value === 'number' || (Array.isArray(value) && typeof value[0] === 'number');
    }

    private isBigint(value: unknown): value is bigint | [bigint, bigint] {
        return typeof value === 'bigint' || (Array.isArray(value) && typeof value[0] === 'bigint');
    }

    private createDateSqlTerm(operator: AASQueryOperator, value: Date | [Date, Date], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ' AND elements.dateValue >= ? AND elements.dateValue <= ?';
        }

        values.push(value);
        return ` AND elements.dateValue ${this.toMySqlOperator(operator)} ?`;
    }

    private createNumberSqlTerm(
        operator: AASQueryOperator,
        value: number | [number, number],
        values: unknown[],
    ): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ' AND elements.numberValue >= ? AND elements.numberValue <= ?';
        }

        values.push(value);
        return ` AND elements.numberValue ${this.toMySqlOperator(operator)} ?`;
    }

    private createBigintSqlTerm(
        operator: AASQueryOperator,
        value: bigint | [bigint, bigint],
        values: unknown[],
    ): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ` AND elements.bigintValue >= ? AND elements.bigintValue <= ?`;
        }

        values.push(value);
        return ` AND elements.bigintValue ${this.toMySqlOperator(operator)} ?`;
    }

    private createBooleanSqlTerm(operator: AASQueryOperator, value: boolean, values: unknown[]): string {
        if (operator === '=') {
            values.push(value);
            return ` AND elements.booleanValue ? <> 0`;
        }

        if (operator === '!=') {
            values.push(value);
            return ` AND elements.booleanValue ? = 0`;
        }

        throw new Error('Invalid operator.');
    }

    private createStringSqlTerm(operator: AASQueryOperator, value: string, values: unknown[]): string {
        if (operator === '=') {
            values.push(`%${value}%`);
            return ' AND elements.stringValue LIKE ?';
        }

        if (operator === '!=') {
            values.push(`%${value}%`);
            return ' AND elements.stringValue NOT LIKE ?';
        }

        throw new Error('Invalid operator.');
    }

    private toMySqlOperator(operator: AASQueryOperator): string {
        return operator === '!=' ? '<>' : operator;
    }

    private isText(value: unknown): value is string {
        return typeof value === 'string';
    }

    private isQuery(value: unknown): value is AASQuery {
        return typeof value === 'object' && !Array.isArray(value);
    }

    private isExpression(value: unknown): value is OrExpression[] {
        return Array.isArray(value);
    }
}
