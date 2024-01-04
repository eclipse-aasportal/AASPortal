/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from './application-error.js';
import { parseDate, parseNumber } from './convert.js';

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
    orExpressions: OrExpression[]
}

export class QueryParser {
    private static readonly minLength = 3;
    private static readonly operatorChars = new Set(['=', '<', '>', '!', '&', '|']);
    private static readonly abbreviations = new Set([
        'prop',
        'mlp',
        'range',
        'ent',
        'file',
        'blob',
        'opr',
        'ref',
        'rel',
        'rela',
        'sm',
        'smc',
        'sml'
    ]);

    private orExpressions: OrExpression[] = [];
    private currentOr?: OrExpression;
    private currentPosition = -1;

    public constructor(expression: string, private readonly language: string = 'en') {
        this.expression = expression.trim();
    }

    public readonly expression: string;

    public get ast(): OrExpression[] {
        this.check();
        return this.orExpressions;
    }

    public check(): void {
        if (this.currentPosition >= 0) {
            return;
        }

        if (!this.expression || this.expression.length < QueryParser.minLength) {
            throw new ApplicationError(
                'QueryParser.MIN_LENGTH',
                `A query expression must contain at least ${QueryParser.minLength} characters.`,
                QueryParser.minLength,
            );
        }

        this.currentPosition = 0;
        this.nextTerm();
        if (this.currentOr && this.currentOr.andExpressions.length > 0) {
            this.orExpressions.push(this.currentOr);
            this.currentOr = undefined;
        }
    }

    private nextTerm(): void {
        this.trimStart();
        if (this.currentPosition >= this.expression.length) {
            throw new ApplicationError(
                'QueryParser.TERM_EXPECTED',
                `Term expected at position ${this.currentPosition}.`,
                this.currentPosition,
            );
        }

        let term: string | AASQuery;
        if (this.expression[this.currentPosition] === '#') {
            term = this.parseExpression();
        } else {
            term = this.getText();
        }

        const link = this.nextLink();
        if (link === '&&') {
            this.addAndTerm(term);
            this.nextTerm();
        } else if (link === '||') {
            this.addLastAndTerm(term);
            this.nextTerm();
        } else {
            this.addAndTerm(term);
        }
    }

    private getText(leaveQuotationMarks: boolean = false): string {
        const c = this.expression[this.currentPosition];
        if (c === '"' || c === '\'') {
            const i = this.expression.indexOf(c, this.currentPosition + 1);
            if (i < 0) {
                throw new ApplicationError(
                    'QueryParser.END_OF_TEXT_NOT_FOUND',
                    `The end of the text, starting at position ${this.currentPosition}, was not found.`,
                    this.currentPosition);
            }

            const text = leaveQuotationMarks
                ? this.expression.substring(this.currentPosition, i + 1)
                : this.expression.substring(this.currentPosition + 1, i);

            this.currentPosition = i + 1;
            return text;
        }

        for (let i = this.currentPosition, n = this.expression.length; i < n; i++) {
            if (QueryParser.operatorChars.has(this.expression[i])) {
                const text = this.expression.substring(this.currentPosition, i);
                this.currentPosition = i;
                return text.trimEnd();
            }
        }

        const text = this.expression.substring(this.currentPosition);
        this.currentPosition = this.expression.length;
        return text;
    }

    private nextLink(): '||' | '&&' | undefined {
        this.trimStart();
        if (this.currentPosition >= this.expression.length) {
            return undefined;
        }

        if (this.expression.startsWith('||', this.currentPosition)) {
            this.currentPosition += 2;
            return '||';
        }

        if (this.expression.startsWith('&&', this.currentPosition)) {
            this.currentPosition += 2;
            return '&&';
        }

        throw new ApplicationError(
            'QueryParser.LINK_EXPECTED',
            `'||' or '&&' expected at position ${this.currentPosition}`,
            this.currentPosition);
    }

    private trimStart(): void {
        while (this.currentPosition < this.expression.length) {
            if (this.expression[this.currentPosition] === ' ') {
                ++this.currentPosition;
            } else {
                break;
            }
        }
    }

    private addAndTerm(term: string | AASQuery): void {
        if (!this.currentOr) {
            this.currentOr = { andExpressions: [] };
        }

        this.currentOr.andExpressions.push(term);
    }

    private addLastAndTerm(term: string | AASQuery): void {
        if (!this.currentOr) {
            this.currentOr = { andExpressions: [term] };
        } else {
            this.currentOr.andExpressions.push(term);
        }

        this.orExpressions.push(this.currentOr)
        this.currentOr = undefined;
    }

    private parseExpression(): AASQuery {
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
        this.trimStart();
        let i = this.currentPosition;
        for (let n = this.expression.length; i < n; i++) {
            const c = this.expression[i];
            if (c === ' ' || c === ':' || QueryParser.operatorChars.has(c)) {
                break;
            }
        }

        if (i === this.currentPosition) {
            throw new ApplicationError(
                'QueryParser.MODEL_TYPE_EXPECTED',
                `Model type abbreviation expected at position ${this.currentPosition}.`,
                this.currentPosition,
            );
        }

        const modelType = this.expression.substring(this.currentPosition, i);
        if (!QueryParser.abbreviations.has(modelType)) {
            throw new ApplicationError(
                'QueryParser.INVALID_ABBREVIATION',
                `"${modelType}" is an invalid model type abbreviation at position ${this.currentPosition}.`,
                modelType,
                this.currentPosition,
            );
        }

        this.currentPosition = i;
        return modelType;
    }

    private parseName(): string | undefined {
        this.trimStart();
        const c = this.expression[this.currentPosition];
        if (c !== ':') {
            return undefined;
        }

        ++this.currentPosition;
        this.trimStart();
        let i = this.currentPosition;
        for (let n = this.expression.length; i < n; i++) {
            const c = this.expression[i];
            if (c === ' ' || QueryParser.operatorChars.has(c)) {
                break;
            }
        }

        if (i === this.currentPosition) {
            throw new ApplicationError(
                'QueryParser.ELEMENT_NAME_EXPECTED',
                `Submodel element name expected at position ${this.currentPosition}.`,
                this.currentPosition,
            );
        }

        const name = this.expression.substring(this.currentPosition, i);
        this.currentPosition = i;
        return name;
    }

    private parseOperator(): AASQueryOperator | undefined {
        this.trimStart();
        const c = this.nextChar();
        if (!c) {
            return undefined;
        }

        if (c === '=') {
            return '=';
        }

        if (c === '<') {
            return this.ifChar('=') ? '<=' : '<';
        }

        if (c === '>') {
            return this.ifChar('=') ? '>=' : '>';
        }

        if (c === '!' && this.ifChar('=')) {
            return '!=';
        }

        if (QueryParser.operatorChars.has(c)) {
            throw new ApplicationError(
                'QueryParser.INVALID_OPERATOR',
                `'${c}' is an invalid operator at position ${this.currentPosition}.`,
                c,
                this.currentPosition,
            );
        }

        return undefined
    }

    private nextChar(): string | undefined {
        if (this.currentPosition < this.expression.length) {
            return this.expression[this.currentPosition++];
        }

        return undefined;
    }

    private ifChar(c: string): boolean {
        if (this.expression[this.currentPosition] === c) {
            ++this.currentPosition;
            return true;
        }

        return false;
    }

    private parseValue(): AASQueryValueType {
        this.trimStart();
        const s = this.getText(true);
        if (s[0] === '"' || s[0] === '\'') {
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
            if (!date) {
                throw new ApplicationError(
                    'QueryParser.INVALID_DATE_EXPRESSION',
                    `'${s}' is an invalid date expression at position ${this.currentPosition}.`,
                    s,
                    this.currentPosition,
                );
            }

            return date;
        }

        if (minMax.length !== 2) {
            throw new ApplicationError(
                'QueryParser.INVALID_RANGE_EXPRESSION',
                `'${s}' is an invalid range expression at position ${this.currentPosition}`,
                s,
                this.currentPosition,
            );
        }

        const min = parseNumber(minMax[0], this.language);
        const max = parseNumber(minMax[1], this.language);
        if (!Number.isNaN(min) || !Number.isNaN(max)) {
            if (Number.isNaN(min) || Number.isNaN(max)) {
                throw new ApplicationError(
                    'QueryParser.INVALID_RANGE_EXPRESSION',
                    `'${s}' is an invalid range expression at position ${this.currentPosition}`,
                    s,
                    this.currentPosition,
                );
            }

            return [min, max];
        }

        const bigMin = this.parseBigint(minMax[0]);
        const bigMax = this.parseBigint(minMax[1]);
        if (bigMin || bigMax) {
            if (!bigMin || !bigMax) {
                throw new ApplicationError(
                    'QueryParser.INVALID_RANGE_EXPRESSION',
                    `'${s}' is an invalid range expression at position ${this.currentPosition}`,
                    s,
                    this.currentPosition,
                );
            }

            return [bigMin, bigMax];
        }

        const minDate = parseDate(minMax[0], this.language);
        const maxDate = parseDate(minMax[1], this.language);
        if (!minDate || !maxDate) {
            throw new ApplicationError(
                'QueryParser.INVALID_RANGE_EXPRESSION',
                `'${s}' is an invalid range expression at position ${this.currentPosition}.`,
                s,
                this.currentPosition,
            );
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
}