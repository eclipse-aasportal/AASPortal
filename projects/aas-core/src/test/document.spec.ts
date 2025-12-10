/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { cloneDeep } from 'lodash-es';
import { beforeEach, describe, it, expect } from 'vitest';
import { AASDocument } from '../lib/types.js';
import * as aas from '../lib/aas.js';
import { testProperty, testSubmodel, testSubmodelElementCollection } from './assets/samples.js';
import { aasEnvironment } from './assets/aas-environment.js';
import { createSpyObj } from './mocks.js';
import {
    equalDocument,
    getChildren,
    getIEC61360Content,
    isAssetAdministrationShell,
    isBlob,
    isMultiLanguageProperty,
    isProperty,
    isReferenceElement,
    isSubmodel,
    isSubmodelElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
    selectReferable,
    selectSubmodel,
    splitIdShortPath,
} from '../lib/document.js';

describe('Document', () => {
    describe('equalDocument', () => {
        let a: AASDocument;
        let b: AASDocument;

        beforeEach(() => {
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

        it('compares equal document', () => {
            expect(equalDocument(a, a)).toBeTruthy();
        });

        it('compares same documents', () => {
            const aa = cloneDeep(a);
            expect(equalDocument(a, aa)).toBeTruthy();
        });

        it('compares different documents', () => {
            expect(equalDocument(a, b)).toBeFalsy();
        });
    });

    describe('isSubmodelElement', () => {
        it('indicates that "Submodel" is not a SubmodelElement', () => {
            const submodel = createSpyObj<aas.Submodel>({}, { modelType: 'Submodel' });
            expect(isSubmodelElement(submodel)).toBeFalsy();
        });

        it('indicates that "Property" is a SubmodelElement', () => {
            const property = createSpyObj<aas.Submodel>({}, { modelType: 'Property' });
            expect(isSubmodelElement(property)).toBeTruthy();
        });

        it('indicates that "ReferenceElement" is a SubmodelElement', () => {
            const referenceElement = createSpyObj<aas.Submodel>({}, { modelType: 'ReferenceElement' });
            expect(isSubmodelElement(referenceElement)).toBeTruthy();
        });

        it('indicates that "null" is not a SubmodelElement', () => {
            expect(isSubmodelElement(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a SubmodelElement', () => {
            expect(isSubmodelElement(undefined)).toBeFalsy();
        });

        it('indicates that "{}" is not a SubmodelElement', () => {
            expect(isSubmodelElement({})).toBeFalsy();
        });
    });

    describe('isAssetAdministrationShell', () => {
        it('identifies an AssetAdministrationShell', () => {
            const shell = createSpyObj<aas.AssetAdministrationShell>({}, { modelType: 'AssetAdministrationShell' });
            expect(isAssetAdministrationShell(shell)).toBeTruthy();
        });

        it('indicates that "null" is not a AssetAdministrationShell', () => {
            expect(isAssetAdministrationShell(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a AssetAdministrationShell', () => {
            expect(isAssetAdministrationShell(undefined)).toBeFalsy();
        });
    });

    describe('isProperty', () => {
        it('identifies a Property', () => {
            const property = createSpyObj<aas.Property>({}, { modelType: 'Property' });
            expect(isProperty(property)).toBeTruthy();
        });

        it('indicates that "null" is not a Property', () => {
            expect(isProperty(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Property', () => {
            expect(isProperty(undefined)).toBeFalsy();
        });
    });

    describe('isBlob', () => {
        it('identifies a Blob', () => {
            const property = createSpyObj<aas.Blob>({}, { modelType: 'Blob' });
            expect(isBlob(property)).toBeTruthy();
        });

        it('indicates that "null" is not a Blob', () => {
            expect(isBlob(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Blob', () => {
            expect(isBlob(undefined)).toBeFalsy();
        });
    });

    describe('isReferenceElement', () => {
        it('identifies a ReferenceElement', () => {
            const referenceElement = createSpyObj<aas.ReferenceElement>({}, { modelType: 'ReferenceElement' });
            expect(isReferenceElement(referenceElement)).toBeTruthy();
        });

        it('indicates that "null" is not a ReferenceElement', () => {
            expect(isReferenceElement(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a ReferenceElement', () => {
            expect(isReferenceElement(undefined)).toBeFalsy();
        });
    });

    describe('isSubmodelElementCollection', () => {
        it('identifies a SubmodelElementCollection', () => {
            const collection = createSpyObj<aas.SubmodelElementCollection>(
                {},
                { modelType: 'SubmodelElementCollection' },
            );

            expect(isSubmodelElementCollection(collection)).toBeTruthy();
        });

        it('indicates that "null" is not a SubmodelElementCollection', () => {
            expect(isSubmodelElementCollection(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a SubmodelElementCollection', () => {
            expect(isSubmodelElementCollection(undefined)).toBeFalsy();
        });
    });

    describe('isSubmodelElementList', () => {
        it('identifies a SubmodelElementList', () => {
            const list = createSpyObj<aas.SubmodelElementList>({}, { modelType: 'SubmodelElementList' });
            expect(isSubmodelElementList(list)).toBeTruthy();
        });

        it('indicates that "null" is not a SubmodelElementList', () => {
            expect(isSubmodelElementList(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a SubmodelElementList', () => {
            expect(isSubmodelElementList(undefined)).toBeFalsy();
        });
    });

    describe('isSubmodel', () => {
        it('identifies a Submodel', () => {
            const submodel = createSpyObj<aas.ReferenceElement>({}, { modelType: 'Submodel' });
            expect(isSubmodel(submodel)).toBeTruthy();
        });

        it('indicates that "null" is not a Submodel', () => {
            expect(isSubmodel(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Submodel', () => {
            expect(isSubmodel(undefined)).toBeFalsy();
        });
    });

    describe('isMultiLanguageProperty', () => {
        it('identifies a MultiLanguageProperty', () => {
            const multiLanguageProperty = createSpyObj<aas.ReferenceElement>(
                {},
                { modelType: 'MultiLanguageProperty' },
            );
            expect(isMultiLanguageProperty(multiLanguageProperty)).toBeTruthy();
        });

        it('indicates that "null" is not a MultiLanguageProperty', () => {
            expect(isMultiLanguageProperty(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a MultiLanguageProperty', () => {
            expect(isMultiLanguageProperty(undefined)).toBeFalsy();
        });
    });

    describe('getChildren', () => {
        it('returns the submodel elements of a Submodel', () => {
            expect(getChildren(testSubmodel).length).toEqual(testSubmodel.submodelElements!.length);
        });

        it('return the submodel elements of a SubmodelElementCollection', () => {
            expect(getChildren(testSubmodelElementCollection).length).toEqual(
                testSubmodelElementCollection.value!.length,
            );
        });

        it('returns an empty array of a Property', () => {
            expect(getChildren(testProperty).length).toEqual(0);
        });

        it('returns the submodels of an AssetAdministrationShell', () => {
            expect(getChildren(aasEnvironment.assetAdministrationShells[0], aasEnvironment)).toEqual(
                aasEnvironment.submodels!,
            );
        });
    });

    describe('getIEC61360Content', () => {
        let env: aas.Environment;
        let property: aas.Property;

        beforeEach(async () => {
            env = aasEnvironment;
            property = selectReferable(env, 'Documentation', 'OperatingManual.DocumentClassificationSystem')!;
        });

        it('', () => {
            expect(getIEC61360Content(env, property)).toBeDefined();
        });
    });

    describe('selectReferable', () => {
        let env: aas.Environment;

        beforeEach(async () => {
            env = aasEnvironment;
        });

        it('selects a Submodel', () => {
            expect(selectReferable(env, 'TechnicalData')).toBeDefined();
        });

        it('selects a Property in a Submodel', () => {
            expect(selectReferable(env, 'TechnicalData', 'MaxTorque')).toBeDefined();
        });

        it('return undefined for an invalid path.', () => {
            expect(selectReferable(env, 'TechnicalData', 'Unknown')).toBeUndefined();
        });

        it('selects "Documentation/OperatingManual/DocumentId"', () => {
            expect(selectReferable(env, 'Documentation', 'OperatingManual.DocumentId')).toBeDefined();
        });
    });

    describe('selectSubmodel', () => {
        let env: aas.Environment;

        beforeEach(() => {
            env = aasEnvironment;
        });

        it('return the submodel to which "DocumentId" belongs.', () => {
            const property: aas.Property = selectReferable(env, 'Documentation', 'OperatingManual.DocumentId')!;
            const submodel: aas.Submodel = selectReferable(env, 'Documentation')!;
            expect(selectSubmodel(env, property)).toEqual(submodel);
        });
    });

    describe('splitIdShortPath', () => {
        it('should split ""', () => {
            expect(splitIdShortPath('')).toEqual([]);
        });

        it('should split "a"', () => {
            expect(splitIdShortPath('a')).toEqual(['a']);
        });

        it('should split "a[0]"', () => {
            expect(splitIdShortPath('a[0]')).toEqual(['a', '0']);
        });

        it('should split "a.b.c[1][3].d[0].e"', () => {
            expect(splitIdShortPath('a.b.c[1][3].d[0].e')).toEqual(['a', 'b', 'c', '1', '3', 'd', '0', 'e']);
        });
    });
});
