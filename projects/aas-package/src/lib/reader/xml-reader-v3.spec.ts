/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { aas, isMultiLanguageProperty } from 'aas-core';
import { XmlReaderV3 } from './xml-reader-v3.js';

describe('XmlReaderV3', () => {
    let reader: XmlReaderV3;
    let xml: string;
    let path: string;

    describe('v3.0', () => {
        describe('read Operation', () => {
            beforeEach(async () => {
                path = fileURLToPath(new URL('../../test/assets/xml/v3/0/operation.xml', import.meta.url));
                xml = (await readFile(path)).toString();
                reader = new XmlReaderV3(xml);
            });

            it('reads an Operation element', () => {
                const env = reader.readEnvironment();
                const operation = env.submodels![0].submodelElements![0] as aas.Operation;
                expect(operation.modelType === 'Operation').toBeTruthy();
                expect(operation.inputVariables?.length).toEqual(1);
                expect(operation.inoutputVariables?.length).toEqual(1);
                expect(operation.outputVariables?.length).toEqual(1);
            });
        });
    });

    describe('v3.1', () => {
        describe('read MultiLanguageProperty', () => {
            beforeEach(async () => {
                path = fileURLToPath(
                    new URL('../../test/assets/xml/v3/1/multi-language-property.xml', import.meta.url),
                );
                xml = (await readFile(path)).toString();
                reader = new XmlReaderV3(xml);
            });

            it('reads an MultiLanguageProperty element', () => {
                const env = reader.readEnvironment();
                const mlp = env.submodels?.at(0)?.submodelElements?.at(0) as aas.MultiLanguageProperty;
                expect(isMultiLanguageProperty(mlp)).toBe(true);
                expect(mlp.idShort).toBe('nRdRe');
                expect(mlp.category).toBe('something_d7cf2dff');
                expect(mlp.displayName).toEqual([{ language: 'zh-CN-a-myext-x-private', text: 'something_535aeb51' }]);
                expect(mlp.description).toEqual([{ language: 'es-419', text: 'something_be9deae0' }]);
                expect(mlp.extensions).toEqual([
                    {
                        name: 'something_aa1af8b3',
                    } satisfies aas.Extension,
                ]);

                expect(mlp.semanticId).toEqual({
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'urn:something00:f4547d0c',
                        },
                    ],
                    type: 'ExternalReference',
                } satisfies aas.Reference);

                expect(mlp.supplementalSemanticIds).toEqual([
                    {
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'urn:another-example10:42487f5a',
                            },
                        ],
                        type: 'ModelReference',
                    } satisfies aas.Reference,
                ]);

                expect(mlp.qualifiers).toEqual([
                    {
                        type: 'something_500f973e',
                        valueType: 'xs:long',
                    } satisfies aas.Qualifier,
                ]);

                expect(mlp.embeddedDataSpecifications).toEqual([
                    {
                        dataSpecification: {
                            keys: [
                                {
                                    type: 'Submodel',
                                    value: 'urn:another-company15:2bd0986b',
                                },
                            ],
                            type: 'ModelReference',
                        },
                        dataSpecificationContent: {
                            modelType: 'DataSpecificationIec61360',
                            preferredName: [
                                {
                                    language: 'sl-rozaj-biske',
                                    text: 'something_7e795ee2',
                                },
                                {
                                    language: 'en-GB',
                                    text: 'Something random in English c8512bdf',
                                },
                            ],
                            value: 'something_4e9c19b7',
                        } as aas.DataSpecificationIec61360,
                    } satisfies aas.EmbeddedDataSpecification,
                ]);

                expect(mlp.value).toEqual([
                    {
                        language: 'sr-Latn-QM',
                        text: 'something_cd7e6587',
                    } satisfies aas.LangString,
                ]);

                expect(mlp.valueId).toEqual({
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'urn:some-company12:e40857e0',
                        },
                    ],
                    type: 'ModelReference',
                } satisfies aas.Reference);
            });
        });
    });
});
