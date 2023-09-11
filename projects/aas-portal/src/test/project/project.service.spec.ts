/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, first, of, Subject, throwError } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { AASLibModule, NotifyService, AuthService, WebSocketFactoryService } from 'aas-lib';
import { WebSocketSubject } from 'rxjs/webSocket';
import {
    aas,
    AASDocument,
    AASContainer,
    WebSocketData,
    AASServerMessage,
    AASWorkspace
} from 'common';

import * as ws from '../assets/test-document';
import { ProjectEffects } from '../../app/project/project.effects';
import { ProjectAPIService } from '../../app/project/project-api.service';
import { projectReducer } from '../../app/project/project.reducer';
import { ProjectState } from '../../app/project/project.state';
import { ProjectService } from '../../app/project/project.service';
import { createEndpoint } from '../../app/configuration';

class TestWebSocketFactoryService implements Partial<WebSocketFactoryService> {
    constructor(private readonly subject: Subject<WebSocketData>) { }

    public create(): WebSocketSubject<WebSocketData> {
        return this.subject as WebSocketSubject<WebSocketData>;
    }
}

describe('ProjectService', () => {
    let service: ProjectService;
    let api: jasmine.SpyObj<ProjectAPIService>;
    let auth: jasmine.SpyObj<AuthService>;
    let store: Store<{ project: ProjectState }>;
    let document1: AASDocument;
    let document2: AASDocument;
    let document3: AASDocument;
    let content: aas.Environment;
    let container1: AASContainer;
    let container2: AASContainer;
    let ws1: AASWorkspace;
    let ws2: AASWorkspace;
    let webSocketSubject: Subject<WebSocketData>;

    beforeEach(() => {
        document1 = ws.createDocument('document1', 'http://localhost/container1');
        document2 = ws.createDocumentHeader('document2', 'http://localhost/container2');
        document3 = ws.createDocument('document3', 'http://localhost/container2');
        document3.modified = true;
        container1 = ws.createContainer('http://localhost/container1', [document1, document2]);
        container2 = ws.createContainer('http://localhost/container2', [document3]);
        ws1 = ws.createWorkspace('WS1', [container1, container2]);
        ws2 = ws.createWorkspace('WS2', [container1, container2]);

        webSocketSubject = new Subject<WebSocketData>();

        api = jasmine.createSpyObj<ProjectAPIService>(
            'ProjectAPIService',
            [
                'getWorkspaces',
                'getDocuments',
                'getDocument',
                'getContent',
                'addEndpoint',
                'removeEndpoint',
                'reset',
                'deleteDocument']);

        api.getWorkspaces.and.returnValue(of([ws1, ws2]));
        api.getDocuments.and.callFake((url: string) => {
            if (url === 'http://localhost/container1') {
                return of([document1, document2]);
            } else if (url === 'http://localhost/container2') {
                return of([document3]);
            }

            return EMPTY;
        });

        api.getContent.and.returnValue(of(content));

        auth = jasmine.createSpyObj<AuthService>('AuthService', ['checkCookie', 'getCookie', 'setCookie']);
        auth.checkCookie.and.returnValue(false);

        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                {
                    provide: ProjectAPIService,
                    useValue: api,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error'])
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: new TestWebSocketFactoryService(webSocketSubject),
                },
                {
                    provide: AuthService,
                    useValue: auth,
                }
            ],
            imports: [
                CommonModule,
                HttpClientTestingModule,
                AASLibModule,
                EffectsModule.forRoot([ProjectEffects]),
                StoreModule.forRoot({
                    project: projectReducer
                }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        service = TestBed.inject(ProjectService);
        store = TestBed.inject(Store);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('has an initial workspace', function (done: DoneFn) {
        service.workspace.pipe(first()).subscribe((workspace) => {
            expect(workspace?.name).toEqual('WS1');
            done();
        });
    });

    it('sets a new active workspace', function (done: DoneFn) {
        service.setWorkspace('WS2');
        service.workspace.pipe(first()).subscribe((value) => {
            expect(value?.name).toEqual('WS2');
            done();
        });
    });

    it('throws an error if the workspace does not exist', function (done: DoneFn) {
        service.setWorkspace('unknown');
        store.select(state => state.project.error).pipe(first()).subscribe({
            next: (error) => {
                expect(error instanceof Error).toBeTrue();
                done();
            }
        })
    });

    it('returns all available documents', function (done: DoneFn) {
        service.documents.pipe(first()).subscribe(documents => {
            expect(documents.map(item => item.idShort)).toEqual(['document1', 'document2', 'document3']);
            done();
        });
    });

    it('adds a new document (with content)', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'Added',
                document: ws.createDocument('AddedDocument', 'http://localhost/container1'),
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.documents.pipe(first()).subscribe((documents) => {
            expect(documents.find((document) => document.idShort === 'AddedDocument')).toBeDefined();
            done();
        });
    });

    it('adds a new document (no content)', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'Added',
                document: ws.createDocumentHeader('AddedDocument', 'http://localhost/container1'),
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.documents.pipe(first()).subscribe((documents) => {
            expect(documents.find((document) => document.idShort === 'AddedDocument')).toBeDefined();
            done();
        });
    });

    it('removes a document', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'Removed',
                document: document2
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.documents.pipe(first()).subscribe((documents) => {
            expect(documents.find((document) => document.idShort === 'AddedDocument')).toBeUndefined();
            done();
        });
    });

    it('updates a document', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'Changed',
                document: document2,
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.documents.pipe(first()).subscribe((documents) => {
            expect(documents.find((document) => document.idShort === 'document2')).toBeDefined();
            done()
        });
    });

    it('adds an AAS container to a workspace', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'ContainerAdded',
                endpoint: createEndpoint('http://localhost/registry', { name: 'WS1', type: 'AASRegistry' }),
                container: ws.createContainer('http://localhost/container3', [])
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.containers.pipe(first()).subscribe({
            next: (containers) => {
                expect(containers.some(item => item.url === 'http://localhost/container3')).toBeTrue();
                done();
            }
        });
    });

    it('removes an AAS container from workspace', function (done: DoneFn) {
        const data: WebSocketData = {
            type: 'AASServerMessage',
            data: {
                type: 'ContainerRemoved',
                endpoint: createEndpoint('http://localhost/registry', { name: 'WS1', type: 'AASRegistry' }),
                container: container2
            } as AASServerMessage,
        };

        webSocketSubject.next(data);

        service.workspaces.pipe(first()).subscribe({
            next: (workspaces) => {
                expect(workspaces.find(item => item.name === 'WS1')!.containers).toEqual([container1]);
                expect(workspaces.find(item => item.name === 'WS2')!.containers).toEqual([container1, container2]);
                done();
            }
        });
    });

    it('adds an AAS endpoint to the current server configuration', function (done: DoneFn) {
        api.addEndpoint.and.returnValue(EMPTY);
        service.addEndpoint(
            'samples',
            createEndpoint('file:///samples', 'samples'))
            .subscribe({
                complete: () => {
                    expect(api.addEndpoint).toHaveBeenCalled();
                    done();
                }
            });
    });

    it('removes an AAS endpoint from the server configuration', function (done: DoneFn) {
        api.removeEndpoint.and.returnValue(EMPTY);
        service.removeEndpoint('samples').subscribe({
            complete: () => {
                expect().nothing();
                done();
            }
        });
    });

    it('restores the default server configuration', function (done: DoneFn) {
        api.reset.and.returnValue(EMPTY);
        service.reset().subscribe({
            complete: () => {
                expect().nothing();
                done();
            }
        });
    });

    it('allows deleting a document', function (done: DoneFn) {
        api.deleteDocument.and.returnValue(EMPTY);
        service.deleteDocument(document1).subscribe({
            complete: () => {
                expect(api.deleteDocument).toHaveBeenCalled();
                done();
            }
        })
    });

    it('applies a modified document', function (done: DoneFn) {
        const modified: AASDocument = { ...document1, modified: true };
        service.applyDocument(modified);
        service.documents.pipe(first()).subscribe(items => {
            const document = items.find(item => item.id === modified.id &&
                item.container === modified.container);

            expect(document).toBeDefined();
            expect(document?.modified).toBeTrue();
            done();
        });
    });

    describe('findDocument', function () {
        it('indicates that any "document1" exist', function (done: DoneFn) {
            service.findDocument('document1').pipe(first()).subscribe(result => {
                expect(result).toBeDefined();
                done();
            })
        });

        it('indicates that "document1" in "http://localhost/container1" exist', function (done: DoneFn) {
            service.findDocument('document1', 'http://localhost/container1').pipe(first()).subscribe(result => {
                expect(result).toBeDefined();
                done();
            })
        });

        it('indicates that "document1" does not exist in "http://localhost/container2" exist', function (done: DoneFn) {
            api.getDocument.and.returnValue(throwError(() => { throw new Error(); }));
            service.findDocument('document1', 'http://localhost/container2').pipe(first()).subscribe(result => {
                expect(result).toBeUndefined();
                done();
            })
        });

        it('indicates that any "document42" does not exist', function (done: DoneFn) {
            api.getDocument.and.returnValue(throwError(() => { throw new Error(); }));
            service.findDocument('document42').pipe(first()).subscribe(result => {
                expect(result).toBeUndefined();
                done();
            })
        });
    });

    describe('getDocument', function () {
        it('gets a document with the id or name "document1"', function (done: DoneFn) {
            service.getDocument('document1').pipe(first()).subscribe(document => {
                expect(document).toEqual(document1);
                done();
            })
        });

        it('gets "document1" from "http://localhost/container1"', function (done: DoneFn) {
            service.getDocument('document1', 'http://localhost/container1').pipe(first()).subscribe(document => {
                expect(document).toEqual(document1);
                done();
            })
        });

        it('gets "document42" from AASServer', function (done: DoneFn) {
            const document42 = ws.createDocumentHeader('document42', 'http://localhost/container42');
            const content = ws.createContent();
            api.getDocument.and.returnValue(of(document42));
            api.getContent.and.returnValue(of(content));

            service.getDocument('document42', 'http://localhost/container42').pipe(first()).subscribe(document => {
                expect(document.idShort).toEqual('document42');
                done();
            })
        });
    });
});