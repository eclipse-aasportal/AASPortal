/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { QueryOperator, Query, AASIndexQuery } from '../aas-index-query.js';

export class MySqlQuery extends AASIndexQuery {

    constructor(query: string, language: string) {
        super(query, language);
    }

    public get joinElements(): boolean {
        for (const or of this.expression.orExpressions) {
            for (const and of or.andExpressions) {
                if (and.startsWith('#')) {
                    return true;
                }
            }
        }

        return false;
    }

    public createSql(values: unknown[]): string {
        try {
            const orQueries: string[] = [];
            for (const or of this.expression.orExpressions) {
                const andQueries: string[] = [];
                for (const expression of or.andExpressions) {
                    if (expression.length >= 3) {
                        if (expression.startsWith('#')) {
                            const query = this.parseExpression(expression);
                            if (query) {
                                andQueries.push(this.createSqlTerm(query, values));
                            }
                        } else {
                            andQueries.push(`documents.endpoint LIKE '%${expression}%' OR documents.id LIKE '%${expression}%' OR documents.idShort LIKE '%${expression}%'`);
                        }
                    }
                }

                orQueries.push(andQueries.join(' AND '));
            }

            return orQueries.join(' OR ');
        } catch (error) {
            return '';
        }
    }

    private createSqlTerm(query: Query, values: unknown[]): string {
        let s = `elements.modelType = "${query.modelType.toLowerCase()}"`;
        if (query.name) {
            s += ` AND elements.idShort LIKE '%${query.name}%'`
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
                s += this.createStringSqlTerm(query.operator, query.value);
            }
        }

        return s;
    }

    private isDate(value: unknown): value is Date | [Date, Date] {
        return value instanceof Date || Array.isArray(value) && value[0] instanceof Date;
    }

    private isNumber(value: unknown): value is number | [number, number] {
        return typeof value === 'number' || Array.isArray(value) && typeof value[0] === 'number';
    }

    private isBigint(value: unknown): value is bigint | [bigint, bigint] {
        return typeof value === 'bigint' || Array.isArray(value) && typeof value[0] === 'bigint';
    }

    private createDateSqlTerm(operator: QueryOperator, value: Date | [Date, Date], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1])
            return ` AND elements.dateValue >= ? AND elements.dateValue <= ?`;
        }

        values.push(value);
        return ` AND elements.dateValue ${this.toMySqlOperator(operator)} ?`;
    }

    private createNumberSqlTerm(operator: QueryOperator, value: number | [number, number], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1])
            return ` AND elements.numberValue >= ? AND elements.numberValue <= ?`;
        }

        values.push(value);
        return ` AND elements.numberValue ${this.toMySqlOperator(operator)} ?`;

    }

    private createBigintSqlTerm(operator: QueryOperator, value: bigint | [bigint, bigint], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1])
            return ` AND elements.bigintValue >= ? AND elements.bigintValue <= ?`;
        }

        values.push(value);
        return ` AND elements.bigintValue ${this.toMySqlOperator(operator)} ?`;

    }

    private createBooleanSqlTerm(operator: QueryOperator, value: boolean, values: unknown[]): string {
        if (operator === '=') {
            return ` AND elements.booleanValue ?`;
        }

        if (operator === '!=') {
            return ` AND elements.booleanValue ?`;
        }

        values.push(value);

        throw new Error('Invalid operator.');
    }

    private createStringSqlTerm(operator: QueryOperator, value: string): string {
        if (operator === '=') {
            return ` AND elements.stringValue LIKE '%${value}%'`;
        }

        if (operator === '!=') {
            return `  AND elements.stringValue NOT LIKE '%${value}%'`;
        }

        throw new Error('Invalid operator.');
    }

    private toMySqlOperator(operator: QueryOperator): string {
        return operator === '!=' ? '<>' : operator;
    }
}