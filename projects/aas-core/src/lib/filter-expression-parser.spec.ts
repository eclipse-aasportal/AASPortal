/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from 'vitest';
import { FilterExpressionParser } from './filter-expression-parser.js';

describe('FilterExpressionParser', () => {
    let parser: FilterExpressionParser;

    it('should created', () => {
        parser = new FilterExpressionParser('', 'en');
        expect(parser).toBeTruthy();
    });

    describe('text search', () => {
        it('text no quotation marks', () => {
            parser = new FilterExpressionParser('Hello World.');
            expect(parser.expressionType).toBe('text');
            expect(parser.clause[0].andConditions[0]).toEqual('Hello');
            expect(parser.clause[1].andConditions[0]).toEqual('World.');
        });

        it('text with double quotation marks', () => {
            parser = new FilterExpressionParser('"Hello World."');
            expect(parser.clause[0].andConditions[0]).toEqual('Hello World.');
        });

        it('text with words and phrase', () => {
            parser = new FilterExpressionParser('"The quick brown fox jumps" over the lazy dog');
            expect(parser.clause[0].andConditions[0]).toEqual('The quick brown fox jumps');
            expect(parser.clause[1].andConditions[0]).toEqual('over');
            expect(parser.clause[2].andConditions[0]).toEqual('the');
            expect(parser.clause[3].andConditions[0]).toEqual('lazy');
            expect(parser.clause[4].andConditions[0]).toEqual('dog');
        });

        it('text with 2 and phrases', () => {
            parser = new FilterExpressionParser('"The quick brown fox jumps" "over the lazy dog"');
            expect(parser.clause[0].andConditions[0]).toEqual('The quick brown fox jumps');
            expect(parser.clause[1].andConditions[0]).toEqual('over the lazy dog');
        });

        it('text with quotation marks', () => {
            parser = new FilterExpressionParser("'Hello World.'");
            expect(parser.clause[0].andConditions[0]).toEqual('Hello World.');
        });

        it('text with starting single quotation mark', () => {
            parser = new FilterExpressionParser("'Hello World.");
            expect(parser.clause[0].andConditions[0]).toEqual('Hello');
            expect(parser.clause[1].andConditions[0]).toEqual('World.');
        });

        it('text with ending double quotation mark', () => {
            parser = new FilterExpressionParser('Hello World."');
            expect(parser.clause[0].andConditions[0]).toEqual('Hello');
            expect(parser.clause[1].andConditions[0]).toEqual('World.');
        });

        it('throws an error if text has less then 3 characters', () => {
            parser = new FilterExpressionParser('ab');
            expect(() => parser.check()).toThrow('FilterExpressionParser.MIN_LENGTH');
        });
    });

    describe('model type conditions', () => {
        it('#prop:name="John Doe"', () => {
            parser = new FilterExpressionParser('#prop:name="John Doe"');
            expect(parser.expressionType).toBe('model-type');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                            operator: '=',
                            value: 'John Doe',
                        },
                    ],
                },
            ]);
        });

        it('# prop : name = "John Doe"', () => {
            parser = new FilterExpressionParser('# prop : name = "John Doe"');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                            operator: '=',
                            value: 'John Doe',
                        },
                    ],
                },
            ]);
        });

        it('#prop:name', () => {
            parser = new FilterExpressionParser('#prop:name');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                        },
                    ],
                },
            ]);
        });

        it('#prop = "John Doe"', () => {
            parser = new FilterExpressionParser('#prop= "John Doe"');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            operator: '=',
                            value: 'John Doe',
                        },
                    ],
                },
            ]);
        });

        it('#prop:number=42', () => {
            parser = new FilterExpressionParser('#prop:number=42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'number',
                            operator: '=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:notEqual != 42', () => {
            parser = new FilterExpressionParser('#prop:notEqual != 42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'notEqual',
                            operator: '!=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:smaller<42', () => {
            parser = new FilterExpressionParser('#prop:smaller<42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'smaller',
                            operator: '<',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:smallerOrEqual<= 42', () => {
            parser = new FilterExpressionParser('#prop:smallerOrEqual<= 42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'smallerOrEqual',
                            operator: '<=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:greater >42', () => {
            parser = new FilterExpressionParser('#prop:greater >42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'greater',
                            operator: '>',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:greaterOrEqual >= 42', () => {
            parser = new FilterExpressionParser('#prop:greaterOrEqual >= 42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'greaterOrEqual',
                            operator: '>=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:boolean=False', () => {
            parser = new FilterExpressionParser('#prop:boolean=False');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'boolean',
                            operator: '=',
                            value: false,
                        },
                    ],
                },
            ]);
        });

        it('#prop:boolean=true', () => {
            parser = new FilterExpressionParser('#prop:boolean=true');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'boolean',
                            operator: '=',
                            value: true,
                        },
                    ],
                },
            ]);
        });

        it('#prop:bigint=1234567890n', () => {
            parser = new FilterExpressionParser('#prop:bigint=1234567890n');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'bigint',
                            operator: '=',
                            value: BigInt(1234567890),
                        },
                    ],
                },
            ]);
        });

        it('#prop:date=12/31/2023', () => {
            parser = new FilterExpressionParser('#prop:date=12/31/2023');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'date',
                            operator: '=',
                            value: new Date(2023, 11, 31),
                        },
                    ],
                },
            ]);
        });

        it('#prop:date=31.12.2023', () => {
            parser = new FilterExpressionParser('#prop:date=31.12.2023', 'de');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'date',
                            operator: '=',
                            value: new Date(2023, 11, 31),
                        },
                    ],
                },
            ]);
        });

        it('#prop:date=31.12.2023 13:14', () => {
            parser = new FilterExpressionParser('#prop:date=31.12.2023 13:14', 'de');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'date',
                            operator: '=',
                            value: new Date(2023, 11, 31, 13, 14),
                        },
                    ],
                },
            ]);
        });

        it('#prop:minMax = -42 ... 42', () => {
            parser = new FilterExpressionParser('#prop:minMax = -42 ... 42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'minMax',
                            operator: '=',
                            value: [-42, 42],
                        },
                    ],
                },
            ]);
        });

        it('#prop:minMax = -42n ... 42n', () => {
            parser = new FilterExpressionParser('#prop:minMax = -42n ... 42n');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'minMax',
                            operator: '=',
                            value: [BigInt(-42), BigInt(42)],
                        },
                    ],
                },
            ]);
        });

        it('#prop:fromUntil = 1/1/2023 ... 12/31/2023', () => {
            parser = new FilterExpressionParser('#prop:fromUntil = 1/1/2023 ... 12/31/2023');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'fromUntil',
                            operator: '=',
                            value: [new Date(2023, 0, 1), new Date(2023, 11, 31)],
                        },
                    ],
                },
            ]);
        });

        it('#prop:fromUntil = 1.1.2023 ... 31.12.2023 (de)', () => {
            parser = new FilterExpressionParser('#prop:fromUntil = 1.1.2023 ... 31.12.2023', 'de');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'fromUntil',
                            operator: '=',
                            value: [new Date(2023, 0, 1), new Date(2023, 11, 31)],
                        },
                    ],
                },
            ]);
        });

        it('#prop:max', () => {
            parser = new FilterExpressionParser('#prop:max');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'max',
                        },
                    ],
                },
            ]);
        });

        it('#prop=manufacturer', () => {
            parser = new FilterExpressionParser('#prop=manufacturer');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            operator: '=',
                            value: 'manufacturer',
                        },
                    ],
                },
            ]);
        });

        it('#prop:name = "John Doe" && #prop:number=42', () => {
            parser = new FilterExpressionParser('#prop:name = "John Doe" && #prop:number=42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                            operator: '=',
                            value: 'John Doe',
                        },
                        {
                            modelType: 'prop',
                            name: 'number',
                            operator: '=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:name = "John Doe" || #prop:number=42', () => {
            parser = new FilterExpressionParser('#prop:name = "John Doe" || #prop:number=42');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                            operator: '=',
                            value: 'John Doe',
                        },
                    ],
                },
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'number',
                            operator: '=',
                            value: 42,
                        },
                    ],
                },
            ]);
        });

        it('#prop:name = "John Doe" && (#prop:number=42 || #prop:number>43)', () => {
            parser = new FilterExpressionParser('#prop:name = "John Doe" && (#prop:number=42 || #prop:number>43)');
            expect(parser.clause).toEqual([
                {
                    andConditions: [
                        {
                            modelType: 'prop',
                            name: 'name',
                            operator: '=',
                            value: 'John Doe',
                        },
                        [
                            {
                                andConditions: [
                                    {
                                        modelType: 'prop',
                                        name: 'number',
                                        operator: '=',
                                        value: 42,
                                    },
                                ],
                            },
                            {
                                andConditions: [
                                    {
                                        modelType: 'prop',
                                        name: 'number',
                                        operator: '>',
                                        value: 43,
                                    },
                                ],
                            },
                        ],
                    ],
                },
            ]);
        });
    });
});
