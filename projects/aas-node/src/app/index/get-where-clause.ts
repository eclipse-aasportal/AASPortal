/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Clause, ConditionOperator, ModelTypeCondition, OrCondition, TextCondition } from 'aas-core';

/**
 * Generates a SQL WHERE clause based on the provided AAS core clause and values.
 */
export function getWhereClause(claus: Clause, values: unknown[]): string {
    return evaluateModelTypeExpression(claus, values);

    function evaluateModelTypeExpression(conditions: OrCondition[], values: unknown[]): string {
        const orSqlTerms: string[] = [];
        for (const or of conditions) {
            const andSqlTerms: string[] = [];
            for (const and of or.andConditions) {
                if (isModelTypeCondition(and)) {
                    andSqlTerms.push(createModelTypeSqlTerm(and, values));
                } else if (isOrConditions(and)) {
                    andSqlTerms.push(`(${evaluateModelTypeExpression(and, values)})`);
                } else {
                    andSqlTerms.push(`(${createTextSqlTerm(and, values)})`);
                }
            }

            orSqlTerms.push(andSqlTerms.join(' AND '));
        }

        return `EXISTS (SELECT 1 FROM elements AS e WHERE d.uuid = e.uuid AND (${orSqlTerms.join(' OR ')}))`;
    }

    function createModelTypeSqlTerm(condition: ModelTypeCondition, values: unknown[]): string {
        let s = `e.modelType = '${condition.modelType.toLowerCase()}'`;
        if (condition.name) {
            values.push(`%${condition.name}%`);
            s += ' AND e.idShort LIKE ?';
        }

        if (condition.value && condition.operator) {
            if (isDate(condition.value)) {
                s += createDateSqlTerm(condition.operator, condition.value, values);
            } else if (isNumber(condition.value)) {
                s += createNumberSqlTerm(condition.operator, condition.value, values);
            } else if (isBigint(condition.value)) {
                s += createBigintSqlTerm(condition.operator, condition.value, values);
            } else if (typeof condition.value === 'boolean') {
                s += createBooleanSqlTerm(condition.operator, condition.value, values);
            } else {
                s += createStringSqlTerm(condition.operator, condition.value, values);
            }
        }

        return s;
    }

    function createTextSqlTerm(condition: TextCondition, values: unknown[]): string {
        const phrase = `%${condition}%`;
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        values.push(phrase);
        return '(d.endpoint LIKE ? OR d.id LIKE ? OR d.idShort LIKE ? OR d.assetId LIKE ? OR e.idShort LIKE ? OR e.id LIKE ? OR e.stringValue LIKE ?)';
    }

    function isDate(value: unknown): value is Date | [Date, Date] {
        return value instanceof Date || (Array.isArray(value) && value[0] instanceof Date);
    }

    function isNumber(value: unknown): value is number | [number, number] {
        return typeof value === 'number' || (Array.isArray(value) && typeof value[0] === 'number');
    }

    function isBigint(value: unknown): value is bigint | [bigint, bigint] {
        return typeof value === 'bigint' || (Array.isArray(value) && typeof value[0] === 'bigint');
    }

    function createDateSqlTerm(operator: ConditionOperator, value: Date | [Date, Date], values: unknown[]): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ' AND e.dateValue >= ? AND e.dateValue <= ?';
        }

        values.push(value);
        return ` AND e.dateValue ${toMySqlOperator(operator)} ?`;
    }

    function createNumberSqlTerm(
        operator: ConditionOperator,
        value: number | [number, number],
        values: unknown[],
    ): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ' AND e.numberValue >= ? AND e.numberValue <= ?';
        }

        values.push(value);
        return ` AND e.numberValue ${toMySqlOperator(operator)} ?`;
    }

    function createBigintSqlTerm(
        operator: ConditionOperator,
        value: bigint | [bigint, bigint],
        values: unknown[],
    ): string {
        if (Array.isArray(value)) {
            values.push(value[0]);
            values.push(value[1]);
            return ` AND e.bigintValue >= ? AND e.bigintValue <= ?`;
        }

        values.push(value);
        return ` AND e.bigintValue ${toMySqlOperator(operator)} ?`;
    }

    function createBooleanSqlTerm(operator: ConditionOperator, value: boolean, values: unknown[]): string {
        if (operator === '=') {
            values.push(value);
            return ` AND e.booleanValue ? <> 0`;
        }

        if (operator === '!=') {
            values.push(value);
            return ` AND e.booleanValue ? = 0`;
        }

        throw new Error('Invalid operator.');
    }

    function createStringSqlTerm(operator: ConditionOperator, value: string, values: unknown[]): string {
        if (operator === '=') {
            values.push(`%${value}%`);
            return ' AND e.stringValue LIKE ?';
        }

        if (operator === '!=') {
            values.push(`%${value}%`);
            return ' AND e.stringValue NOT LIKE ?';
        }

        throw new Error('Invalid operator.');
    }

    function toMySqlOperator(operator: ConditionOperator): string {
        return operator === '!=' ? '<>' : operator;
    }

    function isModelTypeCondition(value: unknown): value is ModelTypeCondition {
        return typeof value === 'object' && typeof (value as ModelTypeCondition).modelType === 'string';
    }

    function isOrConditions(value: unknown): value is OrCondition[] {
        return typeof value !== 'string' && Array.isArray(value);
    }
}
