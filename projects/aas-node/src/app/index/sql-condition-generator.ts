/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ConditionOperator, FilterExpressionParser, ModelTypeCondition, OrCondition, TextCondition } from 'aas-core';
import { ConditionGenerator } from './condition-generator';

export class SqlConditionGenerator implements ConditionGenerator {
    private readonly parser: FilterExpressionParser;

    public constructor(expression: string, language: string = 'en') {
        this.parser = new FilterExpressionParser(expression, language);
    }

    public generate(values: unknown[]): string {
        if (this.parser.expressionType === 'model-type') {
            return this.evaluateModelTypeExpression(this.parser.clause, values);
        }

        return this.evaluateTextExpression(this.parser.clause, values);
    }

    private evaluateModelTypeExpression(conditions: OrCondition[], values: unknown[]): string {
        const orSqlTerms: string[] = [];
        for (const or of conditions) {
            const andSqlTerms: string[] = [];
            for (const and of or.andConditions) {
                if (this.isModelTypeCondition(and)) {
                    andSqlTerms.push(this.createModelTypeSqlTerm(and, values));
                } else if (this.isOrConditions(and)) {
                    andSqlTerms.push(`(${this.evaluateModelTypeExpression(and, values)})`);
                } else {
                    andSqlTerms.push(`(${this.createTextSqlTerm(and, values)})`);
                }
            }

            orSqlTerms.push(andSqlTerms.join(' AND '));
        }

        return orSqlTerms.join(' OR ');
    }

    private evaluateTextExpression(conditions: OrCondition[], values: unknown[]): string {
        const pattern = conditions.flatMap(condition => condition.andConditions).join('|');
        values.push(pattern);
        values.push(pattern);
        values.push(pattern);
        values.push(pattern);
        values.push(pattern);
        values.push(pattern);
        return 'documents.endpoint REGEXP ? OR documents.id REGEXP ? OR documents.idShort REGEXP ? OR elements.idShort REGEXP ? OR elements.id REGEXP ? OR elements.stringValue REGEXP ?';
    }

    private createModelTypeSqlTerm(condition: ModelTypeCondition, values: unknown[]): string {
        let s = `elements.modelType = '${condition.modelType.toLowerCase()}'`;
        if (condition.name) {
            values.push(`%${condition.name}%`);
            s += ' AND elements.idShort LIKE ?';
        }

        if (condition.value && condition.operator) {
            if (this.isDate(condition.value)) {
                s += this.createDateSqlTerm(condition.operator, condition.value, values);
            } else if (this.isNumber(condition.value)) {
                s += this.createNumberSqlTerm(condition.operator, condition.value, values);
            } else if (this.isBigint(condition.value)) {
                s += this.createBigintSqlTerm(condition.operator, condition.value, values);
            } else if (typeof condition.value === 'boolean') {
                s += this.createBooleanSqlTerm(condition.operator, condition.value, values);
            } else {
                s += this.createStringSqlTerm(condition.operator, condition.value, values);
            }
        }

        return s;
    }

    private createTextSqlTerm(condition: TextCondition, values: unknown[]): string {
        const phrase = `%${condition}%`;
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        return '(documents.endpoint LIKE ? OR documents.id LIKE ? OR documents.idShort LIKE ? OR elements.idShort LIKE ? OR elements.id LIKE ? OR elements.stringValue LIKE ?)';
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

    private createDateSqlTerm(operator: ConditionOperator, value: Date | [Date, Date], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ' AND elements.dateValue >= ? AND elements.dateValue <= ?';
        }

        values.push(value);
        return ` AND elements.dateValue ${this.toMySqlOperator(operator)} ?`;
    }

    private createNumberSqlTerm(
        operator: ConditionOperator,
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
        operator: ConditionOperator,
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

    private createBooleanSqlTerm(operator: ConditionOperator, value: boolean, values: unknown[]): string {
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

    private createStringSqlTerm(operator: ConditionOperator, value: string, values: unknown[]): string {
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

    private toMySqlOperator(operator: ConditionOperator): string {
        return operator === '!=' ? '<>' : operator;
    }

    private isModelTypeCondition(value: unknown): value is ModelTypeCondition {
        return typeof value === 'object' && typeof (value as ModelTypeCondition).modelType === 'string';
    }

    private isOrConditions(value: unknown): value is OrCondition[] {
        return typeof value !== 'string' && Array.isArray(value);
    }
}
