import { parseDate, parseNumber } from 'common';

export type QueryOperator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export type BaseValueType = string | number | boolean | bigint | Date;

export type QueryValueType = BaseValueType | [number, number] | [bigint, bigint] | [Date, Date];

export interface Query {
    modelType: string;
    operator?: QueryOperator;
    name?: string;
    value?: QueryValueType;
}

export interface OrExpression {
    andExpressions: string[];
}

export interface Expression {
    orExpressions: OrExpression[]
}

export abstract class AASIndexQuery {
    protected constructor(query: string, protected readonly language: string) {
        this.expression = { orExpressions: this.splitOr(query) };
    }

    protected readonly expression: Expression;

    protected parseValue(s: string): QueryValueType {
        s = s.trim();
        if (!s) {
            return '';
        }

        if (s[0] === '"' || s[0] === '\'' || s[0] === '\`') {
            if (s.length < 2) {
                return '';
            }

            if (s[s.length - 1] !== s[0]) {
                throw new Error('Invalid string termination.');
            }

            return s.substring(1, s.length - 1);
        }

        if (s === 'true') {
            return true;
        }

        if (s === 'false') {
            return false;
        }

        const minMax = s.split('...');
        if (minMax.length === 1) {
            const n = parseNumber(s, this.language);
            if (!Number.isNaN(n)) {
                return n;
            }

            const bigint = this.parseBigint(s);
            if (bigint) {
                return bigint;
            }

            const date = parseDate(s, this.language);
            if (!date) {
                throw new Error('Not supported value expression.');
            }

            return date;
        }

        if (minMax.length !== 2) {
            throw new Error('Invalid min...max expression.');
        }

        const min = parseNumber(minMax[0], this.language);
        const max = parseNumber(minMax[1], this.language);
        if (!Number.isNaN(min) || !Number.isNaN(max)) {
            if (Number.isNaN(min) || Number.isNaN(max)) {
                throw new Error('Invalid min...max expression.');
            }

            return [min, max];
        }

        const bigMin = this.parseBigint(minMax[0]);
        const bigMax = this.parseBigint(minMax[1]);
        if (bigMin || bigMax) {
            if (!bigMin || !bigMax) {
                throw new Error('Invalid min...max expression.');
            }

            return [bigMin, bigMax];
        }

        const minDate = parseDate(minMax[0], this.language);
        const maxDate = parseDate(minMax[1], this.language);
        if (!minDate || !maxDate) {
            throw new Error('Invalid min...max expression.');
        }

        return [minDate, maxDate];
    }

    protected parseExpression(expression: string): Query | undefined {
        let query: Query | undefined;
        const index = expression.indexOf(':');
        const tuple = this.parseOperator(expression);
        if (index >= 0) {
            const modelType = expression.substring(1, index);
            if (modelType) {
                query = { modelType: modelType };
                if (tuple) {
                    query.name = expression.substring(index + 1, tuple.index).trim();
                    query.value = this.parseValue(expression.substring(tuple.index + tuple.operator.length));
                    query.operator = tuple.operator;
                } else {
                    query.name = expression.substring(index + 1);
                }
            }
        } else if (tuple) {
            const modelType = expression.substring(1, tuple.index);
            if (modelType) {
                query = { modelType: modelType };
                query.value = this.parseValue(expression.substring(tuple.index + tuple.operator.length));
                query.operator = tuple.operator;
            }
        } else {
            const modelType = expression.substring(1);
            if (modelType) {
                query = { modelType: modelType };
            }
        }

        return query;
    }

    private splitOr(s: string): OrExpression[] {
        return s.split('||').map(item => ({ andExpressions: this.splitAnd(item) }));
    }

    private splitAnd(s: string): string[] {
        return s.split('&&').map(item => item.trim().toLocaleLowerCase(this.language));
    }

    private parseOperator(expression: string): { index: number, operator: QueryOperator } | undefined {
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

    private parseBigint(s: string): bigint | undefined {
        if (s.length < 2 || s[s.length - 1] !== 'n') {
            return undefined;
        }

        try {
            return BigInt(s.substring(0, s.length - 1));
        } catch {
            return undefined;
        }
    }
}