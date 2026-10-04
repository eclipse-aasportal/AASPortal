/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { parseDate, parseNumber } from './convert.js';
import { ApplicationError } from './types.js';

export type AASQueryOperator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export type BaseValueType = string | number | boolean | bigint | Date;

export type AASQueryValueType = BaseValueType | [number, number] | [bigint, bigint] | [Date, Date];

export interface AASQuery {
    modelType: string;
    operator?: AASQueryOperator;
    name?: string;
    value?: AASQueryValueType;
}

export type AndExpression = string | AASQuery | OrExpression[];

export interface OrExpression {
    andExpressions: AndExpression[];
}

export interface Expression {
    orExpressions: OrExpression[];
}

export type ExpressionType = 'undefined' | 'text' | 'queries';

export class FilterExpressionParser {
    private static readonly minLength = 3;
    private static readonly operatorChars = new Set(['=', '<', '>', '!', '&', '|']);
    private static readonly abbreviations = new Set([
        'blob',
        'ent',
        'file',
        'mlp',
        'opr',
        'prop',
        'range',
        'ref',
        'rel',
        'rela',
        'sm',
        'smc',
        'sml',
    ]);

    private readonly stack: { orExpressions: OrExpression[]; currentOr?: OrExpression }[] = [{ orExpressions: [] }];
    private currentPosition = -1;
    private _hasAASQueries = false;

    public constructor(
        expression: string,
        private readonly language = 'en',
    ) {
        this.expression = expression.trim();
    }

    public readonly expression: string;

    public get ast(): OrExpression[] {
        this.check();
        return this.stack[0].orExpressions;
    }

    public get hasAASQueries(): boolean {
        this.check();
        return this._hasAASQueries;
    }

    public check(): void {
        if (this.currentPosition >= 0) {
            return;
        }

        if (!this.expression || this.expression.length < FilterExpressionParser.minLength) {
            throw new ApplicationError('FilterExpressionParser.MIN_LENGTH', {
                minLength: FilterExpressionParser.minLength,
            });
        }

        this.currentPosition = 0;
        this.nextTerm();

        if (this.stack.length !== 1) {
            throw new ApplicationError('FilterExpressionParser.INVALID_NESTED_EXPRESSION');
        }

        const current = this.stack[this.stack.length - 1];
        if (current.currentOr && current.currentOr.andExpressions.length > 0) {
            current.orExpressions.push(current.currentOr);
            current.currentOr = undefined;
        }
    }

    private nextTerm(): void {
        this.beginTerm();
        let term: string | AASQuery;
        if (this.expression[this.currentPosition] === '#') {
            term = this.parseQuery();
            this._hasAASQueries = true;
        } else {
            if (this._hasAASQueries) {
                throw new ApplicationError('FilterExpressionParser.MIXED_TEXT_AND_QUERIES_NOT_ALLOWED', {
                    currentPosition: this.currentPosition,
                });
            }

            term = this.getText();
        }

        this.endTerm(term);
    }

    private beginTerm(): void {
        if (!this.skipBlanks()) {
            throw new ApplicationError('FilterExpressionParser.TERM_EXPECTED', {
                currentPosition: this.currentPosition,
            });
        }

        if (this.ifChar('(')) {
            this.levelDown();
        }
    }

    private endTerm(term: string | AASQuery | OrExpression[]): void {
        const link = this.nextLink();
        if (link === '&&') {
            this.addAndTerm(term);
            this.nextTerm();
        } else if (link === '||') {
            this.addLastAndTerm(term);
            this.nextTerm();
        } else if (link === ')') {
            this.levelUp(term);
        } else {
            this.addAndTerm(term);
        }
    }

    private levelDown(): void {
        this.stack.push({ orExpressions: [] });
        this.beginTerm();
    }

    private levelUp(term: string | AASQuery | OrExpression[]): void {
        const current = this.stack.pop();
        if (!current) {
            throw new Error('Invalid state: no current stack frame found.');
        }

        if (!current.currentOr) {
            current.currentOr = { andExpressions: [term] };
        } else {
            current.currentOr.andExpressions.push(term);
        }

        current.orExpressions.push(current.currentOr);
        this.endTerm(current.orExpressions);
    }

    private getText(leaveQuotationMarks = false): string {
        const c = this.expression[this.currentPosition];
        if (c === '"' || c === "'") {
            const i = this.expression.indexOf(c, this.currentPosition + 1);
            if (i < 0) {
                throw new ApplicationError('FilterExpressionParser.END_OF_TEXT_NOT_FOUND', {
                    currentPosition: this.currentPosition,
                });
            }

            const text = leaveQuotationMarks
                ? this.expression.substring(this.currentPosition, i + 1)
                : this.expression.substring(this.currentPosition + 1, i);

            this.currentPosition = i + 1;
            return text;
        }

        for (let i = this.currentPosition, n = this.expression.length; i < n; i++) {
            const c = this.expression[i];
            if (c === ')' || FilterExpressionParser.operatorChars.has(c)) {
                const text = this.expression.substring(this.currentPosition, i);
                this.currentPosition = i;
                return text.trimEnd();
            }
        }

        const text = this.expression.substring(this.currentPosition);
        this.currentPosition = this.expression.length;
        return text;
    }

    private nextLink(): '||' | '&&' | ')' | undefined {
        if (!this.skipBlanks()) {
            return undefined;
        }

        if (this.ifChar('||')) {
            return '||';
        }

        if (this.ifChar('&&')) {
            return '&&';
        }

        if (this.ifChar(')')) {
            if (this.stack.length <= 1) {
                throw new ApplicationError('FilterExpressionParser.UNEXPECTED_CLOSING_BRACKET', {
                    currentPosition: this.currentPosition,
                });
            }

            return ')';
        }

        throw new ApplicationError('FilterExpressionParser.LINK_EXPECTED', {
            currentPosition: this.currentPosition,
        });
    }

    private skipBlanks(): boolean {
        while (this.currentPosition < this.expression.length) {
            if (this.expression[this.currentPosition] === ' ') {
                ++this.currentPosition;
            } else {
                break;
            }
        }

        return this.currentPosition < this.expression.length;
    }

    private addAndTerm(term: string | AASQuery | OrExpression[]): void {
        const current = this.stack[this.stack.length - 1];
        if (!current.currentOr) {
            current.currentOr = { andExpressions: [] };
        }

        current.currentOr.andExpressions.push(term);
    }

    private addLastAndTerm(term: string | AASQuery | OrExpression[]): void {
        const current = this.stack[this.stack.length - 1];
        if (!current.currentOr) {
            current.currentOr = { andExpressions: [term] };
        } else {
            current.currentOr.andExpressions.push(term);
        }

        current.orExpressions.push(current.currentOr);
        current.currentOr = undefined;
    }

    private parseQuery(): AASQuery {
        ++this.currentPosition;
        const query: AASQuery = { modelType: this.parseModelType() };
        const name = this.parseName();
        if (name) {
            query.name = name;
        }

        const operator = this.parseOperator();
        if (operator) {
            query.operator = operator;
            query.value = this.parseValue();
        }

        return query;
    }

    private parseModelType(): string {
        this.skipBlanks();
        let i = this.currentPosition;
        for (let n = this.expression.length; i < n; i++) {
            const c = this.expression[i];
            if (c === ' ' || c === ':' || FilterExpressionParser.operatorChars.has(c)) {
                break;
            }
        }

        if (i === this.currentPosition) {
            throw new ApplicationError('FilterExpressionParser.MODEL_TYPE_EXPECTED', {
                currentPosition: this.currentPosition,
            });
        }

        const modelType = this.expression.substring(this.currentPosition, i);
        if (!FilterExpressionParser.abbreviations.has(modelType)) {
            throw new ApplicationError('FilterExpressionParser.INVALID_ABBREVIATION', {
                modelType,
                currentPosition: this.currentPosition,
            });
        }

        this.currentPosition = i;
        return modelType;
    }

    private parseName(): string | undefined {
        this.skipBlanks();
        if (!this.ifChar(':')) {
            return undefined;
        }

        this.skipBlanks();
        let i = this.currentPosition;
        for (let n = this.expression.length; i < n; i++) {
            const c = this.expression[i];
            if (c === ' ' || FilterExpressionParser.operatorChars.has(c)) {
                break;
            }
        }

        if (i === this.currentPosition) {
            throw new ApplicationError('FilterExpressionParser.ELEMENT_NAME_EXPECTED', {
                currentPosition: this.currentPosition,
            });
        }

        const name = this.expression.substring(this.currentPosition, i);
        this.currentPosition = i;
        return name;
    }

    private parseOperator(): AASQueryOperator | undefined {
        if (!this.skipBlanks()) {
            return undefined;
        }

        if (this.ifChar('=')) {
            return '=';
        }

        if (this.ifChar('<=')) {
            return '<=';
        }

        if (this.ifChar('<')) {
            return '<';
        }

        if (this.ifChar('>=')) {
            return '>=';
        }

        if (this.ifChar('>')) {
            return '>';
        }

        if (this.ifChar('!=')) {
            return '!=';
        }

        const c = this.expression[this.currentPosition];
        if (FilterExpressionParser.operatorChars.has(c)) {
            throw new ApplicationError('FilterExpressionParser.INVALID_OPERATOR', {
                operator: c,
                currentPosition: this.currentPosition,
            });
        }

        return undefined;
    }

    private ifChar(c: string): boolean {
        if (this.expression.startsWith(c, this.currentPosition)) {
            this.currentPosition += c.length;
            return true;
        }

        return false;
    }

    private parseValue(): AASQueryValueType {
        this.skipBlanks();
        const s = this.getText(true);
        if (s[0] === '"' || s[0] === "'") {
            return s.substring(1, s.length - 1);
        }

        if (s.toLowerCase() === 'true') {
            return true;
        }

        if (s.toLowerCase() === 'false') {
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
            if (date) {
                return date;
            }

            return s;
        }

        if (minMax.length !== 2) {
            throw new ApplicationError('FilterExpressionParser.INVALID_RANGE_EXPRESSION', {
                expression: s,
                currentPosition: this.currentPosition,
            });
        }

        const min = parseNumber(minMax[0], this.language);
        const max = parseNumber(minMax[1], this.language);
        if (!Number.isNaN(min) || !Number.isNaN(max)) {
            if (Number.isNaN(min) || Number.isNaN(max)) {
                throw new ApplicationError('FilterExpressionParser.INVALID_RANGE_EXPRESSION', {
                    expression: s,
                    currentPosition: this.currentPosition,
                });
            }

            return [min, max];
        }

        const bigMin = this.parseBigint(minMax[0]);
        const bigMax = this.parseBigint(minMax[1]);
        if (bigMin || bigMax) {
            if (!bigMin || !bigMax) {
                throw new ApplicationError('FilterExpressionParser.INVALID_RANGE_EXPRESSION', {
                    expression: s,
                    currentPosition: this.currentPosition,
                });
            }

            return [bigMin, bigMax];
        }

        const minDate = parseDate(minMax[0], this.language);
        const maxDate = parseDate(minMax[1], this.language);
        if (!minDate || !maxDate) {
            throw new ApplicationError('FilterExpressionParser.INVALID_RANGE_EXPRESSION', {
                expression: s,
                currentPosition: this.currentPosition,
            });
        }

        return [minDate, maxDate];
    }

    private parseBigint(s: string): bigint | undefined {
        s = s.trim();
        if (s.length < 2 || s[s.length - 1] !== 'n') {
            return undefined;
        }

        try {
            return BigInt(s.substring(0, s.length - 1));
        } catch {
            return undefined;
        }
    }

    private splitIntoWords(text: string): string[] {
        // Der reguläre Ausdruck sucht nach:
        // 1. "..." inkl. maskierter Zeichen \"
        // 2. '...' inkl. maskierter Zeichen \'
        // 3. Allen Zeichen, die keine Leerzeichen sind (\S+)
        const regex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+/g;

        const matches = text.match(regex);
        return matches ? matches : [];
    }
}
