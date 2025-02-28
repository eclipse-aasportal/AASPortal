/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { cloneDeep } from 'lodash-es';
import { describe, it, expect } from '@jest/globals';
import { AASDocument } from '../lib/types.js';
import * as doc from '../lib/document.js';
import * as aas from '../lib/aas.js';
import { testProperty, testSubmodel, testSubmodelElementCollection } from './assets/samples.js';
import { aasEnvironment } from './assets/aas-environment.js';

describe('Document', function () {
    describe('equalDocument', function () {
        let a: AASDocument;
        let b: AASDocument;

        beforeEach(function () {
            a = {
                id: 'http://customer.com/aas/a',
                endpoint: 'Test',
                address: 'a.json',
                idShort: 'A',
                assetId: 'http://customer.com/asset/a',
                readonly: true,
                crc32: 0,
                timestamp: 0,
            };

            b = {
                id: 'http://customer.com/aas/b',
                endpoint: 'Test',
                address: 'b.json',
                idShort: 'B',
                assetId: 'http://customer.com/asset/b',
                readonly: true,
                crc32: 0,
                timestamp: 0,
            };
        });

        it('compares equal document', function () {
            expect(doc.equalDocument(a, a)).toBeTruthy();
        });

        it('compares same documents', function () {
            const aa = cloneDeep(a);
            expect(doc.equalDocument(a, aa)).toBeTruthy();
        });

        it('compares different documents', function () {
            expect(doc.equalDocument(a, b)).toBeFalsy();
        });
    });

    describe('getChildren', function () {
        it('returns the submodel elements of a Submodel', function () {
            expect(doc.getChildren(testSubmodel).length).toEqual(testSubmodel.submodelElements!.length);
        });

        it('return the submodel elements of a SubmodelElementCollection', function () {
            expect(doc.getChildren(testSubmodelElementCollection).length).toEqual(
                testSubmodelElementCollection.value!.length,
            );
        });

        it('returns an empty array of a Property', function () {
            expect(doc.getChildren(testProperty).length).toEqual(0);
        });

        it('returns the submodels of an AssetAdministrationShell', function () {
            expect(doc.getChildren(aasEnvironment.assetAdministrationShells[0], aasEnvironment)).toEqual(
                aasEnvironment.submodels!,
            );
        });
    });

    describe('resolveReference', function () {
        let env: aas.Environment;

        beforeEach(async function () {
            env = aasEnvironment;
        });

        it('resolves a reference ', function () {
            const reference: aas.Reference = {
                type: 'ModelReference',
                keys: [
                    {
                        type: 'Submodel',
                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    },
                    {
                        type: 'SubmodelElementCollection',
                        value: 'OperatingManual',
                    },
                    {
                        type: 'File',
                        value: 'DigitalFile_PDF',
                    },
                ],
            };

            expect(doc.resolveReference(env, reference)).toBeDefined();
        });

        it('returns undefined for an invalid reference', function () {
            const reference: aas.Reference = {
                type: 'ModelReference',
                keys: [
                    {
                        type: 'Submodel',
                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    },
                    {
                        type: 'SubmodelElementCollection',
                        value: 'OperatingManual',
                    },
                    {
                        type: 'File',
                        value: 'unknown',
                    },
                ],
            };

            expect(doc.resolveReference(env, reference)).toBeUndefined();
        });
    });

    describe('getIEC61360Content', function () {
        let env: aas.Environment;
        let property: aas.Property;

        beforeEach(async function () {
            env = aasEnvironment;
            property = doc.selectElement(env, 'Documentation', 'OperatingManual', 'DocumentClassificationSystem')!;
        });

        it('', function () {
            expect(doc.getIEC61360Content(env, property)).toBeDefined();
        });
    });

    describe('selectElement', function () {
        let env: aas.Environment;

        beforeEach(async function () {
            env = aasEnvironment;
        });

        it('selects a Submodel', function () {
            expect(doc.selectElement(env, 'TechnicalData')).toBeDefined();
        });

        it('selects a Property in a Submodel', function () {
            expect(doc.selectElement(env, 'TechnicalData', 'MaxTorque')).toBeDefined();
        });

        it('return undefined for an invalid path.', function () {
            expect(doc.selectElement(env, 'TechnicalData', 'Unknown')).toBeUndefined();
        });

        it('return undefined for an empty path.', function () {
            expect(doc.selectElement(env)).toBeUndefined();
        });

        it('selects "Documentation/OperatingManual/DocumentId"', function () {
            expect(doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')).toBeDefined();
        });
    });

    describe('getParent', function () {
        let child: aas.Referable;
        let parent: aas.Referable;

        beforeEach(function () {
            parent = doc.selectElement(aasEnvironment, 'TechnicalData')!;
            child = doc.selectElement(aasEnvironment, 'TechnicalData', 'MaxTorque')!;
        });

        it('gets the parent of a child', function () {
            expect(doc.getParent(aasEnvironment, child)).toEqual(parent);
        });

        it('returns "undefined" for an identifiable', function () {
            expect(doc.getParent(aasEnvironment, parent)).toBeUndefined();
        });
    });

    describe('selectReferable', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('selects an AAS', function () {
            const reference: aas.Reference = {
                type: 'ModelReference',
                keys: [
                    {
                        type: 'AssetAdministrationShell',
                        value: 'http://customer.com/aas/9175_7013_7091_9168',
                    },
                ],
            };

            expect(doc.selectReferable(env, reference)).toEqual(env.assetAdministrationShells[0]);
        });

        it('selects the "Documentation" submodel', function () {
            const reference: aas.Reference = {
                type: 'ModelReference',
                keys: [
                    {
                        type: 'Submodel',
                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    },
                ],
            };

            const submodel: aas.Submodel = doc.selectElement(env, 'Documentation')!;
            expect(doc.selectReferable(env, reference)).toEqual(submodel);
        });

        it('selects the "DocumentId" property', function () {
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            const reference: aas.Reference = {
                type: 'ModelReference',
                keys: [
                    {
                        type: 'Submodel',
                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                    },
                    {
                        type: 'SubmodelElementCollection',
                        value: 'OperatingManual',
                    },
                    {
                        type: 'Property',
                        value: 'DocumentId',
                    },
                ],
            };

            expect(doc.selectReferable(env, reference)).toEqual(property);
        });
    });

    describe('getParent', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('returns "OperatingManual" as parent of "DocumentId"', function () {
            const collection: aas.SubmodelElementCollection = doc.selectElement(
                env,
                'Documentation',
                'OperatingManual',
            )!;
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            expect(doc.getParent(env, property)).toEqual(collection);
        });

        it('returns "undefined" while "Documentation" has no parent', function () {
            const submodel: aas.Submodel = doc.selectElement(env, 'Documentation')!;
            expect(doc.getParent(env, submodel)).toBeUndefined();
        });
    });

    describe('isDescendent', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('indicates that "DocumentId" is a descendant of "OperatingManual"', function () {
            const collection: aas.SubmodelElementCollection = doc.selectElement(
                env,
                'Documentation',
                'OperatingManual',
            )!;
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            expect(doc.isDescendant(env, collection, property)).toBeTruthy();
        });

        it('indicates that "DocumentId" is a descendant of "Documentation"', function () {
            const submodel: aas.Submodel = doc.selectElement(env, 'Documentation')!;
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            expect(doc.isDescendant(env, submodel, property)).toBeTruthy();
        });

        it('indicates that "MaxTorque" is not a descendant of "Documentation"', function () {
            const submodel: aas.Submodel = doc.selectElement(env, 'Documentation')!;
            const property: aas.Property = doc.selectElement(env, 'TechnicalData', 'MaxTorque')!;
            expect(doc.isDescendant(env, submodel, property)).toBeFalsy();
        });
    });

    describe('normalize', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('bla', function () {
            const collection: aas.SubmodelElementCollection = doc.selectElement(
                env,
                'Documentation',
                'OperatingManual',
            )!;
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            expect(doc.normalize(env, [collection, property])).toEqual([collection]);
        });
    });

    describe('selectSubmodel', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('return the submodel to which "DocumentId" belongs.', function () {
            const property: aas.Property = doc.selectElement(env, 'Documentation', 'OperatingManual.DocumentId')!;
            const submodel: aas.Submodel = doc.selectElement(env, 'Documentation')!;
            expect(doc.selectSubmodel(env, property)).toEqual(submodel);
        });
    });

    describe('diff', function () {
        let env: aas.Environment;

        beforeEach(function () {
            env = aasEnvironment;
        });

        it('determines no diffs if source and target equal', function () {
            const target = env;
            expect(doc.diff(env, target)).toEqual([]);
        });

        it('determines no diffs if target is a shallow copy of source', function () {
            const target = { ...env };
            expect(doc.diff(env, target)).toEqual([]);
        });

        it('determines no diffs if target is a deep clone of source', function () {
            const target = { ...env };
            expect(doc.diff(env, target)).toEqual([]);
        });

        it('detects a new submodel in source', function () {
            const target = { ...env, submodels: env.submodels!.slice(1) };
            expect(doc.diff(env, target)).toEqual([
                {
                    type: 'inserted',
                    sourceIndex: 0,
                    sourceElement: env.submodels![0],
                },
            ]);
        });

        it('detects a deleted submodel in source', function () {
            const target = cloneDeep(env);
            const source = { ...env, submodels: env.submodels!.slice(1) };
            expect(doc.diff(source, target)).toEqual([
                {
                    type: 'deleted',
                    destinationIndex: 0,
                    destinationElement: target.submodels![0],
                },
            ]);
        });

        it('detects a changed property value', function () {
            const target = env;
            const source = cloneDeep(env);
            const property: aas.Property = doc.selectElement(source, 'TechnicalData', 'MaxTorque')!;
            property.value = '42';
            expect(doc.diff(source, target)).toEqual([
                {
                    type: 'changed',
                    destinationParent: doc.selectElement(target, 'TechnicalData'),
                    destinationElement: doc.selectElement(target, 'TechnicalData', 'MaxTorque'),
                    destinationIndex: 1,
                    sourceParent: doc.selectElement(source, 'TechnicalData'),
                    sourceElement: doc.selectElement(source, 'TechnicalData', 'MaxTorque'),
                    sourceIndex: 1,
                },
            ]);
        });
    });

    describe('getAbsolutePath', function () {
        it('gets the absolute path of "MaxTorque"', function () {
            const property: aas.Property = doc.selectElement(aasEnvironment, 'TechnicalData', 'MaxTorque')!;
            expect(doc.getAbsolutePath(property)).toEqual([
                'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                'MaxTorque',
            ]);
        });
    });

    describe('getIdShortPath', function () {
        it('gets the idShort path of "DocumentId"', function () {
            const property: aas.Property = doc.selectElement(
                aasEnvironment,
                'Documentation',
                'OperatingManual.DocumentId',
            )!;
            expect(doc.getIdShortPath(property)).toEqual('OperatingManual.DocumentId');
        });
    });
});