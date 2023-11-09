/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AASWorkspace } from 'common';

import { ProjectAPIService } from '../../app/project/project-api.service';
import { createDocument } from '../assets/test-document';

describe('ProjectApiService', function () {
    let service: ProjectAPIService;
    let httpTestingController: HttpTestingController;

    beforeEach(function () {

        TestBed.configureTestingModule({
            declarations: [],
            providers: [],
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(ProjectAPIService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });

    it('GET: /api/v1/workspaces', function () {
        const workspaces: AASWorkspace[] = [
            {
                name: 'WS1',
                containers: []
            },
            {
                name: 'WS2',
                containers: []
            },
        ];

        service.getWorkspaces().subscribe(value => {
            expect(value).toEqual(workspaces);
        });

        const req = httpTestingController.expectOne('/api/v1/workspaces');
        expect(req.request.method).toEqual('GET');
        req.flush(workspaces);
    });

    it('GET: /api/v1/controllers/:url/documents/:id', function () {
        const document = createDocument('document1');

        service.getDocument('document1', 'https:/www.fraunhofer.de/container1').subscribe(value => {
            expect(value).toEqual(document);
        });

        const req = httpTestingController.expectOne('/api/v1/containers/aHR0cHM6L3d3dy5mcmF1bmhvZmVyLmRlL2NvbnRhaW5lcjE/documents/ZG9jdW1lbnQx');
        expect(req.request.method).toEqual('GET');
        req.flush(document);
    });

    it('GET: /api/v1/documents/:id', function () {
        const document = createDocument('document1');

        service.getDocument('document1').subscribe(value => {
            expect(value).toEqual(document);
        });

        const req = httpTestingController.expectOne('/api/v1/documents/ZG9jdW1lbnQx');
        expect(req.request.method).toEqual('GET');
        req.flush(document);
    });

    it('GET: /api/v1/containers/:url/documents', function () {
        const documents = [createDocument('document1'), createDocument('document2')];

        service.getDocuments('https:/www.fraunhofer.de/container1').subscribe(value => {
            expect(value).toEqual(documents);
        });

        const req = httpTestingController.expectOne('/api/v1/containers/aHR0cHM6L3d3dy5mcmF1bmhvZmVyLmRlL2NvbnRhaW5lcjE/documents');
        expect(req.request.method).toEqual('GET');
        req.flush(documents);
    });

    it('GET: /api/v1/containers/:url/documents/:id/content', function () {
        const root = createDocument('document1').content!;

        service.getContent('document1', 'https:/www.fraunhofer.de/container1').subscribe(value => {
            expect(value).toEqual(root);
        });

        const req = httpTestingController.expectOne('/api/v1/containers/aHR0cHM6L3d3dy5mcmF1bmhvZmVyLmRlL2NvbnRhaW5lcjE/documents/ZG9jdW1lbnQx/content');
        expect(req.request.method).toEqual('GET');
        req.flush(root);
    });

    it('POST: /api/v1/endpoints/:name', function () {
        const name = 'Test';
        const url = `file:///resources/samples/`;
        service.addEndpoint({ name, url, type: 'AasxDirectory', version: '3.0' }).subscribe();
        const req = httpTestingController.expectOne('/api/v1/endpoints/Test');
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual({ url });
    });

    it('DELETE: /api/v1/endpoints/:name', function () {
        service.removeEndpoint('samples').subscribe();
        const req = httpTestingController.expectOne('/api/v1/endpoints/samples');
        expect(req.request.method).toEqual('DELETE');
    });

    it('DELETE: /api/v1/containers/:url/documents/:id', function () {
        service.deleteDocument('document1', 'https:/www.fraunhofer.de/container1').subscribe();
        const req = httpTestingController.expectOne('/api/v1/containers/aHR0cHM6L3d3dy5mcmF1bmhvZmVyLmRlL2NvbnRhaW5lcjE/documents/ZG9jdW1lbnQx');
        expect(req.request.method).toEqual('DELETE');
    });
});