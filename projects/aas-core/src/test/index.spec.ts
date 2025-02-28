/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { createSpyObj } from 'fhg-jest';
import {
    aas,
    equalUrls,
    getEndpointName,
    getEndpointType,
    isAssetAdministrationShell,
    isBlob,
    isHasSemantics,
    isMultiLanguageProperty,
    isProperty,
    isReference,
    isReferenceElement,
    isSubmodel,
    isSubmodelElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
    isUrlSafeBase64,
    isValidEMail,
    isValidPassword,
    stringFormat,
} from '../lib/index.js';
import { HasSemantics, Reference } from '../lib/aas.js';

describe('index', () => {
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

    describe('equalUrls', () => {
        it('returns true for same URLs', () => {
            expect(equalUrls('https://www.fraunhofer.de/', 'https://www.fraunhofer.de/')).toBeTruthy();
        });

        it('returns true for equal URLs', () => {
            const url = 'https://www.fraunhofer.de/';
            expect(equalUrls(url, url)).toBeTruthy();
        });

        it('returns true for same URLs, one missing leading "/"', () => {
            expect(equalUrls('https://www.fraunhofer.de', 'https://www.fraunhofer.de/')).toBeTruthy();
        });

        it('returns true for same URLs, different character case', () => {
            expect(equalUrls('https://www.fraunhofer.de/', 'https://WWW.Fraunhofer.DE/')).toBeTruthy();
        });

        it('returns false for different URLs', () => {
            expect(equalUrls('https://www.fraunhofer.de/', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns false if one URL is empty.', () => {
            expect(equalUrls('', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns false if one URL is invalid.', () => {
            expect(equalUrls('invalid', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns true for same file system path', () => {
            expect(equalUrls('C:\\Git\\AASPortal\\data\\samples', 'C:\\Git\\AASPortal\\data\\samples')).toBeTruthy();
        });

        it('returns true for different file system path', () => {
            expect(equalUrls('C:\\Git\\AASPortal\\data\\samples', 'C:\\Git\\AASPortal\\data\\other')).toBeFalsy();
        });
    });

    describe('Is valid e-mail', () => {
        it('recognize valid e-mail format', () => {
            expect(isValidEMail('webaas@iosb-ina.fraunhofer.de')).toBeTruthy();
        });

        it('recognize invalid e-mail format', () => {
            expect(isValidEMail('invalid')).toBeFalsy();
        });
    });

    describe('Is valid password', () => {
        it('valid password', () => {
            expect(isValidPassword('aZ0-+_$%!§?#*~.,;:')).toBeTruthy();
        });

        it('at least 8 characters', () => {
            expect(isValidPassword('1234567')).toBeFalsy();
        });

        it('more then 20 characters', () => {
            expect(isValidPassword('123456789012345678901')).toBeFalsy();
        });

        it('invalid characters', () => {
            expect(isValidPassword('1234567\\/ ')).toBeFalsy();
        });
    });

    describe('stringFormat', () => {
        it('returns a string with no format items', () => {
            expect(stringFormat('Hello World!')).toEqual('Hello World!');
        });

        it('string format item', () => {
            expect(stringFormat('Hello {0}!', 'World')).toEqual('Hello World!');
        });

        it('two string format items', () => {
            expect(stringFormat('{1} {0}!', 'World', 'Hello')).toEqual('Hello World!');
        });

        it('twice string format item', () => {
            expect(stringFormat('Hello {0}, {0}!', 'World')).toEqual('Hello World, World!');
        });

        it('number format item', () => {
            expect(stringFormat('PI is {0}', Math.PI)).toEqual('PI is ' + Math.PI.toString());
        });

        it('boolean format item', () => {
            expect(stringFormat('True is {0} and false is {1}.', true, false)).toEqual(
                'True is true and false is false.',
            );
        });

        it('formats item with toString method', () => {
            expect(stringFormat('Hello {0}', { toString: () => 'World!' })).toEqual('Hello World!');
        });

        it('undefined format item', () => {
            expect(stringFormat('{0}', undefined)).toEqual('<undefined>');
        });

        it('null format item', () => {
            expect(stringFormat('{0}', null)).toEqual('<null>');
        });

        it('invalid format item', () => {
            expect(stringFormat('{1}', 'Invalid')).toEqual('<undefined>');
        });
    });

    describe('isUrlSafeBase64', () => {
        it('indicates that "https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237" is not url-safe-base64 encoded', () => {
            expect(isUrlSafeBase64('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237')).toBeFalsy();
        });

        it('indicates that "aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw" is url-safe-base64 encoded', () => {
            expect(
                isUrlSafeBase64('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw'),
            ).toBeTruthy();
        });
    });

    describe('getEndpointName', () => {
        it('gets the endpoint name from an URL string', () => {
            expect(getEndpointName('http://localhost:1234/?name=Test')).toEqual('Test');
        });

        it('gets the endpoint name from a URL', () => {
            expect(getEndpointName(new URL('http://localhost:1234/?name=Test'))).toEqual('Test');
        });

        it('gets the default name of an AASX server', () => {
            expect(getEndpointName('http://localhost:1234/')).toEqual('http://localhost:1234/');
        });

        it('gets the default name of an cloud server', () => {
            expect(getEndpointName('http://localhost:1234/endpoints/samples')).toEqual('samples');
        });

        it('gets the default name of an OPCUA server', () => {
            expect(getEndpointName(new URL('opc.tcp://172.16.160.178:30001/I4AASServer'))).toEqual('I4AASServer');
        });

        it('gets the default name of an file system directory', () => {
            expect(getEndpointName('file:///endpoints/samples')).toEqual('samples');
        });
    });

    describe('getEndpointType', () => {
        it('gets = from http://localhost:1234/', () => {
            expect(getEndpointType('http://localhost:1234/')).toEqual('AAS_API');
        });

        it('gets "AAS_API" from http://localhost:1234/?type=aas-api', () => {
            expect(getEndpointType('http://localhost:1234/?type=aas-api')).toEqual('AAS_API');
        });

        it('gets "OPC_UA" from opc.tcp://localhost:1234/I4AASServer', () => {
            expect(getEndpointType(new URL('opc.tcp://localhost:1234/I4AASServer'))).toEqual('OPC_UA');
        });

        it('gets "WebDAV" from http://localhost:1234/endpoints/sample?type=webdav', () => {
            expect(getEndpointType('http://localhost:1234/endpoints/sample?type=webdav')).toEqual('WebDAV');
        });

        it('gets "FileSystem" from file:///endpoints/samples', () => {
            expect(getEndpointType('file:///endpoints/samples')).toEqual('FileSystem');
        });
    });

    describe('isReference', () => {
        it('indicates that value is of type reference', () => {
            const value: Reference = {
                keys: [],
                type: 'ExternalReference',
            };

            expect(isReference(value)).toBeTruthy();
        });

        it('indicates that "{}" is not of type Reference', () => {
            expect(isReference({})).toBeFalsy();
        });

        it('indicates that "undefined" is not of type Reference', () => {
            expect(isReference(undefined)).toBeFalsy();
        });

        it('indicates that "null" is not of type Reference', () => {
            expect(isReference(null)).toBeFalsy();
        });
    });

    describe('isHasSemantics', () => {
        it('indicates that value is of type HasSemantics', () => {
            const value: HasSemantics = {
                semanticId: {
                    keys: [],
                    type: 'ExternalReference',
                },
            };

            expect(isHasSemantics(value)).toBeTruthy();
        });

        it('indicates that "{}" is not of type HasSemantics', () => {
            expect(isHasSemantics({})).toBeFalsy();
        });

        it('indicates that "undefined" is not of type HasSemantics', () => {
            expect(isHasSemantics(undefined)).toBeFalsy();
        });

        it('indicates that "null" is not of type HasSemantics', () => {
            expect(isHasSemantics(null)).toBeFalsy();
        });
    });
});