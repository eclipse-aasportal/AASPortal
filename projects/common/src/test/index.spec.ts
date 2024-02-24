/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { createSpyObj } from './utils.js';
import {
    aas,
    equalUrls,
    getEndpointName,
    getEndpointType,
    isAssetAdministrationShell,
    isBlob,
    isMultiLanguageProperty,
    isProperty,
    isReferenceElement,
    isSubmodel,
    isSubmodelElement,
    isUrlSafeBase64,
    isValidEMail,
    isValidPassword,
    stringFormat,
} from '../lib/index.js';

describe('index', function () {
    describe('isSubmodelElement', function () {
        it('indicates that "Submodel" is not a SubmodelElement', function () {
            const submodel = createSpyObj<aas.Submodel>({}, { modelType: 'Submodel' });
            expect(isSubmodelElement(submodel)).toBeFalsy();
        });

        it('indicates that "Property" is a SubmodelElement', function () {
            const property = createSpyObj<aas.Submodel>({}, { modelType: 'Property' });
            expect(isSubmodelElement(property)).toBeTruthy();
        });

        it('indicates that "ReferenceElement" is a SubmodelElement', function () {
            const referenceElement = createSpyObj<aas.Submodel>({}, { modelType: 'ReferenceElement' });
            expect(isSubmodelElement(referenceElement)).toBeTruthy();
        });

        it('indicates that "null" is not a SubmodelElement', function () {
            expect(isSubmodelElement(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a SubmodelElement', function () {
            expect(isSubmodelElement(undefined)).toBeFalsy();
        });

        it('indicates that "{}" is not a SubmodelElement', function () {
            expect(isSubmodelElement({})).toBeFalsy();
        });
    });

    describe('isAssetAdministrationShell', function () {
        it('identifies an AssetAdministrationShell', function () {
            const shell = createSpyObj<aas.AssetAdministrationShell>({}, { modelType: 'AssetAdministrationShell' });
            expect(isAssetAdministrationShell(shell)).toBeTruthy();
        });

        it('indicates that "null" is not a AssetAdministrationShell', function () {
            expect(isAssetAdministrationShell(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a AssetAdministrationShell', function () {
            expect(isAssetAdministrationShell(undefined)).toBeFalsy();
        });
    });

    describe('isProperty', function () {
        it('identifies a Property', function () {
            const property = createSpyObj<aas.Property>({}, { modelType: 'Property' });
            expect(isProperty(property)).toBeTruthy();
        });

        it('indicates that "null" is not a Property', function () {
            expect(isProperty(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Property', function () {
            expect(isProperty(undefined)).toBeFalsy();
        });
    });

    describe('isBlob', function () {
        it('identifies a Blob', function () {
            const property = createSpyObj<aas.Blob>({}, { modelType: 'Blob' });
            expect(isBlob(property)).toBeTruthy();
        });

        it('indicates that "null" is not a Blob', function () {
            expect(isBlob(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Blob', function () {
            expect(isBlob(undefined)).toBeFalsy();
        });
    });

    describe('isReferenceElement', function () {
        it('identifies a ReferenceElement', function () {
            const referenceElement = createSpyObj<aas.ReferenceElement>({}, { modelType: 'ReferenceElement' });
            expect(isReferenceElement(referenceElement)).toBeTruthy();
        });

        it('indicates that "null" is not a ReferenceElement', function () {
            expect(isReferenceElement(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a ReferenceElement', function () {
            expect(isReferenceElement(undefined)).toBeFalsy();
        });
    });

    describe('isSubmodel', function () {
        it('identifies a Submodel', function () {
            const submodel = createSpyObj<aas.ReferenceElement>({}, { modelType: 'Submodel' });
            expect(isSubmodel(submodel)).toBeTruthy();
        });

        it('indicates that "null" is not a Submodel', function () {
            expect(isSubmodel(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a Submodel', function () {
            expect(isSubmodel(undefined)).toBeFalsy();
        });
    });

    describe('isMultiLanguageProperty', function () {
        it('identifies a MultiLanguageProperty', function () {
            const multiLanguageProperty = createSpyObj<aas.ReferenceElement>(
                {},
                { modelType: 'MultiLanguageProperty' },
            );
            expect(isMultiLanguageProperty(multiLanguageProperty)).toBeTruthy();
        });

        it('indicates that "null" is not a MultiLanguageProperty', function () {
            expect(isMultiLanguageProperty(null)).toBeFalsy();
        });

        it('indicates that "undefined" is not a MultiLanguageProperty', function () {
            expect(isMultiLanguageProperty(undefined)).toBeFalsy();
        });
    });

    describe('equalUrls', function () {
        it('returns true for same URLs', function () {
            expect(equalUrls('https://www.fraunhofer.de/', 'https://www.fraunhofer.de/')).toBeTruthy();
        });

        it('returns true for equal URLs', function () {
            const url = 'https://www.fraunhofer.de/';
            expect(equalUrls(url, url)).toBeTruthy();
        });

        it('returns true for same URLs, one missing leading "/"', function () {
            expect(equalUrls('https://www.fraunhofer.de', 'https://www.fraunhofer.de/')).toBeTruthy();
        });

        it('returns true for same URLs, different character case', function () {
            expect(equalUrls('https://www.fraunhofer.de/', 'https://WWW.Fraunhofer.DE/')).toBeTruthy();
        });

        it('returns false for different URLs', function () {
            expect(equalUrls('https://www.fraunhofer.de/', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns false if one URL is empty.', function () {
            expect(equalUrls('', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns false if one URL is invalid.', function () {
            expect(equalUrls('invalid', 'http://www.fraunhofer.de/')).toBeFalsy();
        });

        it('returns true for same file system path', function () {
            expect(equalUrls('C:\\Git\\AASPortal\\data\\samples', 'C:\\Git\\AASPortal\\data\\samples')).toBeTruthy();
        });

        it('returns true for different file system path', function () {
            expect(equalUrls('C:\\Git\\AASPortal\\data\\samples', 'C:\\Git\\AASPortal\\data\\other')).toBeFalsy();
        });
    });

    describe('Is valid e-mail', function () {
        it('recognize valid e-mail format', function () {
            expect(isValidEMail('webaas@iosb-ina.fraunhofer.de')).toBeTruthy();
        });

        it('recognize invalid e-mail format', function () {
            expect(isValidEMail('invalid')).toBeFalsy();
        });
    });

    describe('Is valid password', function () {
        it('valid password', function () {
            expect(isValidPassword('aZ0-+_$%!§?#*~.,;:')).toBeTruthy();
        });

        it('at least 8 characters', function () {
            expect(isValidPassword('1234567')).toBeFalsy();
        });

        it('more then 20 characters', function () {
            expect(isValidPassword('123456789012345678901')).toBeFalsy();
        });

        it('invalid characters', function () {
            expect(isValidPassword('1234567\\/ ')).toBeFalsy();
        });
    });

    describe('stringFormat', function () {
        it('returns a string with no format items', function () {
            expect(stringFormat('Hello World!')).toEqual('Hello World!');
        });

        it('string format item', function () {
            expect(stringFormat('Hello {0}!', 'World')).toEqual('Hello World!');
        });

        it('two string format items', function () {
            expect(stringFormat('{1} {0}!', 'World', 'Hello')).toEqual('Hello World!');
        });

        it('twice string format item', function () {
            expect(stringFormat('Hello {0}, {0}!', 'World')).toEqual('Hello World, World!');
        });

        it('number format item', function () {
            expect(stringFormat('PI is {0}', Math.PI)).toEqual('PI is ' + Math.PI.toString());
        });

        it('boolean format item', function () {
            expect(stringFormat('True is {0} and false is {1}.', true, false)).toEqual(
                'True is true and false is false.',
            );
        });

        it('formats item with toString method', function () {
            expect(stringFormat('Hello {0}', { toString: () => 'World!' })).toEqual('Hello World!');
        });

        it('undefined format item', function () {
            expect(stringFormat('{0}', undefined)).toEqual('<undefined>');
        });

        it('null format item', function () {
            expect(stringFormat('{0}', null)).toEqual('<null>');
        });

        it('invalid format item', function () {
            expect(stringFormat('{1}', 'Invalid')).toEqual('<undefined>');
        });
    });

    describe('isUrlSafeBase64', function () {
        it('indicates that "https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237" is not url-safe-base64 encoded', function () {
            expect(isUrlSafeBase64('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237')).toBeFalsy();
        });

        it('indicates that "aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw" is url-safe-base64 encoded', function () {
            expect(
                isUrlSafeBase64('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw'),
            ).toBeTruthy();
        });
    });

    describe('getEndpointName', function () {
        it('gets the endpoint name from an URL string', function () {
            expect(getEndpointName('http://localhost:1234/?name=Test')).toEqual('Test');
        });

        it('gets the endpoint name from a URL', function () {
            expect(getEndpointName(new URL('http://localhost:1234/?name=Test'))).toEqual('Test');
        });

        it('gets the default name of an AASX server', function () {
            expect(getEndpointName('http://localhost:1234/')).toEqual('http://localhost:1234/');
        });

        it('gets the default name of an cloud server', function () {
            expect(getEndpointName('http://localhost:1234/endpoints/samples')).toEqual('samples');
        });

        it('gets the default name of an OPCUA server', function () {
            expect(getEndpointName(new URL('opc.tcp://172.16.160.178:30001/I4AASServer'))).toEqual('I4AASServer');
        });

        it('gets the default name of an file system directory', function () {
            expect(getEndpointName('file:///endpoints/samples')).toEqual('samples');
        });
    });

    describe('getEndpointType', function () {
        it('gets the endpoint type from an URL string', function () {
            expect(getEndpointType('http://localhost:1234/')).toEqual('AASServer');
        });

        it('gets the endpoint type from a URL', function () {
            expect(getEndpointType(new URL('opc.tcp://localhost:1234/I4AASServer'))).toEqual('OpcuaServer');
        });

        it('gets "AASServer" as default', function () {
            expect(getEndpointType('http://localhost:1234/endpoints/sample')).toEqual('WebDAV');
        });

        it('gets "WebDAV" as default', function () {
            expect(getEndpointType('file:///endpoints/samples')).toEqual('FileSystem');
        });
    });
});
