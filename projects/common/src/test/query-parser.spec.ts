/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals'
import { QueryParser } from '../lib/query-parser.js';

describe('QueryParser', () => {
    let parser: QueryParser;

    it('should created', () => {
        parser = new QueryParser('', 'en');
        expect(parser).toBeTruthy();
    });

    describe('check', () => {
        it('text no quotation marks', () => {
            parser = new QueryParser('Hello World.');
            parser.check();
            expect(parser.ast[0].andExpressions[0]).toEqual('Hello World.')
        });

        it('text with double quotation marks', () => {
            parser = new QueryParser('"Hello World."');
            parser.check();
            expect(parser.ast[0].andExpressions[0]).toEqual('Hello World.')
        });

        it('throws an error if end double quotation marks is missing', () => {
            parser = new QueryParser('"Hello World.');
            expect(() => parser.check()).toThrowError();
        });

        it('text with quotation marks', () => {
            parser = new QueryParser("'Hello World.'");
            parser.check();
            expect(parser.ast[0].andExpressions[0]).toEqual('Hello World.')
        });

        it('throws an error if end quotation marks is missing', () => {
            parser = new QueryParser("'Hello World.");
            expect(() => parser.check()).toThrowError();
        });

        it('A && B', () => {
            parser = new QueryParser('A && B');
            parser.check();
            expect(parser.ast).toEqual([{ andExpressions: ['A', 'B'] }]);
        });

        it('A&&B', () => {
            parser = new QueryParser('A&&B');
            parser.check();
            expect(parser.ast).toEqual([{ andExpressions: ['A', 'B'] }]);
        });

        it('A || B', () => {
            parser = new QueryParser('A || B');
            parser.check();
            expect(parser.ast).toEqual([{ andExpressions: ['A'] }, { andExpressions: ['B'] }]);
        });

        it('A && B || C && D', () => {
            parser = new QueryParser('A && B || C && D');
            parser.check();
            expect(parser.ast).toEqual([{ andExpressions: ['A', 'B'] }, { andExpressions: ['C', 'D'] }]);
        });

        it('throws an error for invalid link "A = B"', () => {
            parser = new QueryParser('A = B');
            expect(() => parser.check()).toThrowError();
        });

        it('throws an error for missing operand "A || "', () => {
            parser = new QueryParser('A || ');
            expect(() => parser.check()).toThrowError();
        });
    });

    describe('check', () => {
        it('#prop:name="John Doe"', () => {
            parser = new QueryParser('#prop:name="John Doe"');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'name', 
                        operator: '=', 
                        value: 'John Doe',
                    },
                ],
            }]);
        });

        it('# prop : name = "John Doe"', () => {
            parser = new QueryParser('# prop : name = "John Doe"');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'name', 
                        operator: '=', 
                        value: 'John Doe',
                    },
                ],
            }]);
        });

        it('#prop:name', () => {
            parser = new QueryParser('#prop:name');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'name', 
                    },
                ],
            }]);
        });

        it('#prop = "John Doe"', () => {
            parser = new QueryParser('#prop= "John Doe"');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        operator: '=', 
                        value: 'John Doe',
                    },
                ],
            }]);
        });

        it('#prop:number=42', () => {
            parser = new QueryParser('#prop:number=42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'number', 
                        operator: '=', 
                        value: 42,
                    },
                ],
            }]);
        });

        it('#prop:notEqual != 42', () => {
            parser = new QueryParser('#prop:notEqual != 42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'notEqual', 
                        operator: '!=', 
                        value: 42,
                    },
                ],
            }]);
        });
 
        it('#prop:smaller<42', () => {
            parser = new QueryParser('#prop:smaller<42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'smaller', 
                        operator: '<', 
                        value: 42,
                    },
                ],
            }]);
        });
 
        it('#prop:smallerOrEqual<= 42', () => {
            parser = new QueryParser('#prop:smallerOrEqual<= 42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'smallerOrEqual', 
                        operator: '<=', 
                        value: 42,
                    },
                ],
            }]);
        });
 
        it('#prop:greater >42', () => {
            parser = new QueryParser('#prop:greater >42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'greater', 
                        operator: '>', 
                        value: 42,
                    },
                ],
            }]);
        });
 
        it('#prop:greaterOrEqual >= 42', () => {
            parser = new QueryParser('#prop:greaterOrEqual >= 42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'greaterOrEqual', 
                        operator: '>=', 
                        value: 42,
                    },
                ],
            }]);
        });

        it('#prop:boolean=False', () => {
            parser = new QueryParser('#prop:boolean=False');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'boolean', 
                        operator: '=', 
                        value: false,
                    },
                ],
            }]);
        });
 
        it('#prop:boolean=true', () => {
            parser = new QueryParser('#prop:boolean=true');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'boolean', 
                        operator: '=', 
                        value: true,
                    },
                ],
            }]);
        });
 
        it('#prop:bigint=1234567890n', () => {
            parser = new QueryParser('#prop:bigint=1234567890n');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'bigint', 
                        operator: '=', 
                        value: BigInt(1234567890),
                    },
                ],
            }]);
        });
 
        it('#prop:date=12/31/2023', () => {
            parser = new QueryParser('#prop:date=12/31/2023');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'date', 
                        operator: '=', 
                        value: new Date(2023, 11, 31),
                    },
                ],
            }]);
        });

        
        it('#prop:date=31.12.2023', () => {
            parser = new QueryParser('#prop:date=31.12.2023', 'de');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'date', 
                        operator: '=', 
                        value: new Date(2023, 11, 31),
                    },
                ],
            }]);
        });

        it('#prop:date=31.12.2023 13:14', () => {
            parser = new QueryParser('#prop:date=31.12.2023 13:14', 'de');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'date', 
                        operator: '=', 
                        value: new Date(2023, 11, 31, 13, 14),
                    },
                ],
            }]);
        });

        it('#prop:minMax = -42 ... 42', () => {
            parser = new QueryParser('#prop:minMax = -42 ... 42');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'minMax', 
                        operator: '=', 
                        value: [-42, 42],
                    },
                ],
            }]);
        });

        it('#prop:minMax = -42n ... 42n', () => {
            parser = new QueryParser('#prop:minMax = -42n ... 42n');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'minMax', 
                        operator: '=', 
                        value: [BigInt(-42), BigInt(42)],
                    },
                ],
            }]);
        });

        it('#prop:fromUntil = 1/1/2023 ... 12/31/2023', () => {
            parser = new QueryParser('#prop:fromUntil = 1/1/2023 ... 12/31/2023');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'fromUntil', 
                        operator: '=', 
                        value: [new Date(2023, 0, 1), new Date(2023, 11, 31)],
                    },
                ],
            }]);
        });

        it('#prop:fromUntil = 1.1.2023 ... 31.12.2023 (de)', () => {
            parser = new QueryParser('#prop:fromUntil = 1.1.2023 ... 31.12.2023', 'de');
            parser.check();
            expect(parser.ast).toEqual([{
                andExpressions: [
                    {
                        modelType: 'prop',
                        name: 'fromUntil', 
                        operator: '=', 
                        value: [new Date(2023, 0, 1), new Date(2023, 11, 31)],
                    },
                ],
            }]);
        });
    });
});