/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpEventType, provideHttpClient } from '@angular/common/http';
import { lastValueFrom, of } from 'rxjs';
import { AASDocument, AASEndpoint } from 'aas-core';
import { AuthService } from '../../core/auth/auth.service';
import { EndpointsApi } from './endpoints-api';
import { createSpyObj } from '../../../test/mocks';

import sample from '../../../test/assets/dpp-sample.json';

describe('EndpointsApi', () => {
    let service: EndpointsApi;
    let httpTestingController: HttpTestingController;
    let httpClient: HttpClient;
    let auth: Mocked<AuthService>;

    beforeEach(() => {
        auth = createSpyObj<AuthService>(['login'], { ready: of(true) });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(EndpointsApi);
        httpTestingController = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/endpoints/{name}/documents/{id}}', async () => {
            const promise = lastValueFrom(service.getDocument('AssetAdministrationShell', 'document1', 'Samples'));
            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(sample);
            expect(await promise).toEqual(sample as AASDocument);
        });
    });

    describe('deleteDocument', () => {
        it('should DELETE /api/v1/endpoints/:url/packages/:id', async () => {
            const id = 'document123';
            const url = 'endpoint6';
            const encodedUrl = 'ZW5kcG9pbnQ2'; // encodeBase64Url('endpoint6')
            const encodedId = 'ZG9jdW1lbnQxMjM'; // encodeBase64Url('document123')
            const promise = lastValueFrom(service.deletePackage(id, url));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedUrl}/packages/${encodedId}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
            expect(await promise).toBe(null);
        });
    });

    describe('getContent', () => {
        it('/api/v1/endpoints/:name/documents/:id/content}', async () => {
            const promise = lastValueFrom(service.getContent('document1', 'Samples'));
            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx/content');
            expect(req.request.method).toEqual('GET');
            req.flush(sample.content);

            expect(await promise).toEqual((sample as AASDocument).content!);
        });
    });

    describe('putDocument', () => {
        it('should PUT /api/v1/endpoints/:endpoint/documents/:id with document content', async () => {
            const document: AASDocument = {
                id: 'doc42',
                endpoint: 'endpoint7',
                content: { some: 'data' },
            } as unknown as AASDocument;

            const encodedEndpoint = 'ZW5kcG9pbnQ3'; // encodeBase64Url('endpoint7')
            const encodedId = 'ZG9jNDI'; // encodeBase64Url('doc42')
            const promise = lastValueFrom(service.putDocument(document));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedEndpoint}/documents/${encodedId}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(document.content);
            req.flush(null);
            expect(await promise).toBe(null);
        });

        it('should throw error if document.content is null or undefined', () => {
            const document: AASDocument = {
                id: 'doc43',
                endpoint: 'endpoint8',
                content: undefined,
            } as unknown as AASDocument;

            expect(() => service.putDocument(document)).toThrow('Document content is null or undefined.');
        });
    });

    describe('uploadPackage', () => {
        it('should POST /api/v1/endpoints/:name/packages with the file', async () => {
            const file = new File(['dummy content'], 'test.aasx', { type: 'application/octet-stream' });
            const encodedName = 'U2FtcGxlcw'; // encodeBase64Url('Samples')
            const promise = lastValueFrom(service.uploadPackage('Samples', file));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedName}/packages`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body instanceof FormData).toBe(true);
            expect(req.request.body.get('file')).toBe(file);
            expect(req.request.reportProgress).toBe(true);
            req.flush({});
            expect((await promise).type).toEqual(HttpEventType.Response);
        });
    });

    describe('downloadPackage', () => {
        it('downloads an AASX package file', async () => {
            const spy = vi.spyOn(httpClient, 'get').mockReturnValue(of(new Blob()));
            const endpoint = 'Sample & QA/Prod?region=de#1';
            const encodedId = 'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw';
            await lastValueFrom(
                service.downloadPackage(
                    endpoint,
                    'https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237',
                    'Test.aasx',
                ),
            );

            expect(spy).toHaveBeenCalledWith(
                `/api/v1/packages/${encodedId}?endpoint=${encodeURIComponent(endpoint)}`,
                expect.objectContaining({ responseType: 'blob' }),
            );
        });
    });

    describe('download', () => {
        it('downloads a file resource', async () => {
            const spy = vi.spyOn(httpClient, 'get').mockReturnValue(of(new Blob()));
            await lastValueFrom(service.download('http://localhost/folder/file', 'Test.txt'));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('getEndpoints', () => {
        it('should GET /api/v1/endpoints and return endpoints array', async () => {
            const mockEndpoints: AASEndpoint[] = [
                { name: 'endpoint1', url: 'http://localhost/endpoint1', type: 'AAS_API' },
                { name: 'endpoint2', url: 'http://localhost/endpoint2', type: 'AAS_API' },
            ];

            const promise = lastValueFrom(service.getEndpoints());
            const req = httpTestingController.expectOne('/api/v1/endpoints');
            expect(req.request.method).toBe('GET');
            req.flush(mockEndpoints);

            expect(await promise).toEqual(mockEndpoints);
        });
    });

    describe('addEndpoint', () => {
        it('should POST /api/v1/endpoints with the endpoint data', async () => {
            const newEndpoint: AASEndpoint = {
                name: 'endpoint3',
                url: 'http://localhost/endpoint3',
                type: 'AAS_API',
            };

            const promise = lastValueFrom(service.addEndpoint(newEndpoint));
            const req = httpTestingController.expectOne('/api/v1/endpoints');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newEndpoint);
            req.flush(null);
            expect(await promise).toBe(null);
        });
    });

    describe('updateEndpoint', () => {
        it('should PUT /api/v1/endpoints/:name with the endpoint data', async () => {
            const endpoint: AASEndpoint = {
                name: 'endpoint4',
                url: 'http://localhost/endpoint4',
                type: 'AAS_API',
            };

            const encodedName = 'ZW5kcG9pbnQ0'; // encodeBase64Url('endpoint4')
            const promise = lastValueFrom(service.updateEndpoint(endpoint));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedName}`);
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(endpoint);
            req.flush(null);
            expect(await promise).toBe(null);
        });
    });

    describe('removeEndpoint', () => {
        it('should DELETE /api/v1/endpoints/:name', async () => {
            const endpointName = 'endpoint5';
            const encodedName = 'ZW5kcG9pbnQ1'; // encodeBase64Url('endpoint5')
            const promise = lastValueFrom(service.removeEndpoint(endpointName));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedName}`);
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
            expect(await promise).toBe(null);
        });
    });

    describe('getDocumentCount', () => {
        it('should GET /api/v1/endpoints/:name/document-count and return the document count', async () => {
            const endpointName = 'endpoint6';
            const encodedName = 'ZW5kcG9pbnQ2'; // encodeBase64Url('endpoint6')
            const mockDocumentCount = 42;

            const promise = lastValueFrom(service.getDocumentCount(endpointName));
            const req = httpTestingController.expectOne(`/api/v1/endpoints/${encodedName}/document-count`);
            expect(req.request.method).toBe('GET');
            req.flush(mockDocumentCount);

            expect(await promise).toEqual(mockDocumentCount);
        });
    });
});
