/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASQuery, AASQueryOperator, OrExpression } from 'aas-core';
import { AASIndexQuery } from '../aas-index-query.js';

export class MySqlQuery extends AASIndexQuery {
    public constructor(expression: string, language: string = 'en') {
        super(expression, language);
    }

    public get joinElements(): boolean {
        return this.queryParser.hasAASQueries;
    }

    public createSql(values: unknown[]): string {
        try {
            return this.evaluate(this.queryParser.ast, values);
        } catch {
            return '';
        }
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
                    andSqlTerms.push(
                        `(documents.endpoint LIKE '%${and}%' OR documents.id LIKE '%${and}%' OR documents.idShort LIKE '%${and}%')`,
                    );
                }
            }

            orSqlTerms.push(andSqlTerms.join(' AND '));
        }

        return orSqlTerms.join(' OR ');
    }

    private createSqlTerm(query: AASQuery, values: unknown[]): string {
        let s = `elements.modelType = "${query.modelType.toLowerCase()}"`;
        if (query.name) {
            s += ` AND elements.idShort LIKE '%${query.name}%'`;
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
            return ` AND elements.dateValue >= ? AND elements.dateValue <= ?`;
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
            return ` AND elements.numberValue >= ? AND elements.numberValue <= ?`;
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
            return ` AND elements.booleanValue ?`;
        }

        if (operator === '!=') {
            return ` AND elements.booleanValue ?`;
        }

        values.push(value);

        throw new Error('Invalid operator.');
    }

    private createStringSqlTerm(operator: AASQueryOperator, value: string): string {
        if (operator === '=') {
            return ` AND elements.stringValue LIKE '%${value}%'`;
        }

        if (operator === '!=') {
            return `  AND elements.stringValue NOT LIKE '%${value}%'`;
        }

        throw new Error('Invalid operator.');
    }

    private toMySqlOperator(operator: AASQueryOperator): string {
        return operator === '!=' ? '<>' : operator;
    }
}
