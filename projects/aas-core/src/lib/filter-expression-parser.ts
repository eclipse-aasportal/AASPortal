/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { parseDate, parseNumber } from './convert.js';
import { ApplicationError } from './types.js';

export type ConditionOperator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export type BaseValueType = string | number | boolean | bigint | Date;

export type ConditionValueType = BaseValueType | [number, number] | [bigint, bigint] | [Date, Date];

export interface ModelTypeCondition {
    modelType: string;
    operator?: ConditionOperator;
    name?: string;
    value?: ConditionValueType;
}

export type TextCondition = string;

export type AndCondition = TextCondition | ModelTypeCondition | OrCondition[];

export interface OrCondition {
    andConditions: AndCondition[];
}

export type Clause = OrCondition[];

export type ExpressionType = undefined | 'text' | 'model-type';

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

    private readonly stack: { ors: OrCondition[]; currentOr?: OrCondition }[] = [{ ors: [] }];
    private currentPosition = -1;
    private _expressionType: ExpressionType = undefined;

    public constructor(
        expression: string,
        private readonly language = 'en',
    ) {
        this.expression = expression.trim();
    }

    public readonly expression: string;

    public get expressionType(): ExpressionType {
        this.check();
        return this._expressionType;
    }

    public get clause(): Clause {
        this.check();
        return this.stack[0].ors;
    }

    public check(): void {
        if (this._expressionType !== undefined) {
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
        if (current.currentOr && current.currentOr.andConditions.length > 0) {
            current.ors.push(current.currentOr);
            current.currentOr = undefined;
        }
    }

    private nextTerm(): void {
        this.beginTerm();
        if (this.expression[this.currentPosition] === '#') {
            if (this._expressionType === 'text') {
                throw new ApplicationError('FilterExpressionParser.MIXED_TEXT_AND_MODEL_TYPE_CONDITIONS_NOT_ALLOWED', {
                    currentPosition: this.currentPosition,
                });
            }

            this._expressionType = 'model-type';
            this.endTerm(this.parseModelTypeCondition());
        } else {
            if (this._expressionType !== undefined) {
                throw new ApplicationError('FilterExpressionParser.MIXED_TEXT_AND_MODEL_TYPE_CONDITIONS_NOT_ALLOWED', {
                    currentPosition: this.currentPosition,
                });
            }

            this._expressionType = 'text';
            this.stack[0].ors.push(
                ...this.splitIntoWords(this.expression).map(
                    word =>
                        ({
                            andConditions: [word],
                        }) satisfies OrCondition,
                ),
            );
        }
    }

    private beginTerm(): void {
        if (!this.skipBlanks()) {
            throw new ApplicationError('FilterExpressionParser.TERM_EXPECTED', {
                currentPosition: this.currentPosition,
            });
        }

        if (this.ifChar('(')) {
            this._expressionType = 'model-type';
            this.levelDown();
        }
    }

    private endTerm(term: ModelTypeCondition | OrCondition[]): void {
        const link = this.nextLink();
        if (link === '&&') {
            this.addAndCondition(term);
            this.nextTerm();
        } else if (link === '||') {
            this.addLastAndCondition(term);
            this.nextTerm();
        } else if (link === ')') {
            this.levelUp(term);
        } else {
            this.addAndCondition(term);
        }
    }

    private levelDown(): void {
        this.stack.push({ ors: [] });
        this.beginTerm();
    }

    private levelUp(term: ModelTypeCondition | OrCondition[]): void {
        const current = this.stack.pop();
        if (!current) {
            throw new Error('Invalid state: no current stack frame found.');
        }

        if (!current.currentOr) {
            current.currentOr = { andConditions: [term] };
        } else {
            current.currentOr.andConditions.push(term);
        }

        current.ors.push(current.currentOr);
        this.endTerm(current.ors);
    }

    private getText(): string {
        const c = this.expression[this.currentPosition];
        if (c === '"' || c === "'") {
            const i = this.expression.indexOf(c, this.currentPosition + 1);
            if (i < 0) {
                throw new ApplicationError('FilterExpressionParser.END_OF_TEXT_NOT_FOUND', {
                    currentPosition: this.currentPosition,
                });
            }

            const text = this.expression.substring(this.currentPosition + 1, i);
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

    private addAndCondition(term: AndCondition): void {
        const current = this.stack[this.stack.length - 1];
        if (!current.currentOr) {
            current.currentOr = { andConditions: [] };
        }

        current.currentOr.andConditions.push(term);
    }

    private addLastAndCondition(term: AndCondition): void {
        const current = this.stack[this.stack.length - 1];
        if (!current.currentOr) {
            current.currentOr = { andConditions: [term] };
        } else {
            current.currentOr.andConditions.push(term);
        }

        current.ors.push(current.currentOr);
        current.currentOr = undefined;
    }

    private parseModelTypeCondition(): ModelTypeCondition {
        ++this.currentPosition;
        const condition: ModelTypeCondition = { modelType: this.parseModelType() };
        const name = this.parseName();
        if (name) {
            condition.name = name;
        }

        const operator = this.parseOperator();
        if (operator) {
            condition.operator = operator;
            condition.value = this.parseValue();
        }

        return condition;
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

    private parseOperator(): ConditionOperator | undefined {
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

    private parseValue(): ConditionValueType {
        this.skipBlanks();
        const s = this.getText();
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
        const regex = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\S+/g;
        const matches = text.match(regex) ?? [text];
        this.currentPosition = this.expression.length;
        return matches.map(match => {
            if (match.startsWith('"') || match.startsWith("'")) {
                match = match.slice(1);
            }

            if (match.endsWith('"') || match.endsWith("'")) {
                match = match.slice(0, -1);
            }

            return match;
        });
    }
}
