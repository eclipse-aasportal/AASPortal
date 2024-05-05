/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASDocument, WebSocketData } from 'common';
import { BehaviorSubject, Subject, first } from 'rxjs';
import { AASTreeComponent } from '../../lib/aas-tree/aas-tree.component';
import { sampleDocument } from '../assets/sample-document';
import { NotifyService } from '../../lib/notify/notify.service';
import { DownloadService } from '../../lib/download.service';
import { WindowService } from '../../lib/window.service';
import { WebSocketFactoryService } from '../../lib/web-socket-factory.service';
import { TestWebSocketFactoryService } from '../assets/test-web-socket-factory.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AASTreeStore } from '../../lib/aas-tree/aas-tree.store';

describe('AASTreeComponent', () => {
    let component: AASTreeComponent;
    let fixture: ComponentFixture<AASTreeComponent>;
    let document: AASDocument;
    let webSocketSubject: Subject<WebSocketData>;
    let store: AASTreeStore;

    beforeEach(() => {
        document = sampleDocument;
        webSocketSubject = new Subject<WebSocketData>();

        TestBed.configureTestingModule({
            declarations: [AASTreeComponent],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log']),
                },
                {
                    provide: DownloadService,
                    useValue: jasmine.createSpyObj<DownloadService>([
                        'downloadFileAsync',
                        'downloadDocument',
                        'uploadDocuments',
                    ]),
                },
                {
                    provide: WindowService,
                    useValue: jasmine.createSpyObj<WindowService>(['addEventListener', 'open', 'removeEventListener']),
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: new TestWebSocketFactoryService(webSocketSubject),
                },
                AASTreeStore,
            ],
            imports: [
                NgbModule,
                CommonModule,
                HttpClientTestingModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(AASTreeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        store = TestBed.inject(AASTreeStore);
        component.document = document;
        component.ngOnChanges({
            document: new SimpleChange(null, document, true),
        });
    });

    afterEach(() => {
        webSocketSubject?.unsubscribe();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('gets the current document', () => {
        expect(component.document).toEqual(document);
    });

    it('indicates if document is online-ready', () => {
        expect(component.onlineReady).toEqual(document.onlineReady ? document.onlineReady : false);
    });

    it('indicates if document is read-only', () => {
        expect(component.readonly).toEqual(document.readonly);
    });

    it('indicates if the document is modified', () => {
        expect(component.modified).toEqual(document.modified ? document.modified : false);
    });

    it('shows the current offline state', () => {
        expect(component.state).toEqual('offline');
    });

    it('indicates if no node is selected', () => {
        expect(component.someSelected).toBeFalse();
    });

    it('shows the first level ExampleMotor', () => {
        const nodes = component.nodes;
        expect(nodes).toBeTruthy();
        expect(nodes.length).toEqual(5);
        expect(nodes[0].element.idShort).toEqual('ExampleMotor');
        expect(nodes[0].expanded).toBeTrue();
        expect(nodes[1].element.idShort).toEqual('Identification');
        expect(nodes[2].element.idShort).toEqual('TechnicalData');
        expect(nodes[3].element.idShort).toEqual('OperationalData');
        expect(nodes[4].element.idShort).toEqual('Documentation');
    });

    describe('toggleSelection', () => {
        it('toggle selection of all rows', () => {
            component.toggleSelections();
            expect(store.rows.every(value => value.selected)).toBeTrue();
        });
    });

    describe('collapse', () => {
        it('collapse root element', () => {
            expect(component.nodes.length).toEqual(1);
            expect(component.nodes[0].element.idShort).toEqual('ExampleMotor');
            expect(component.nodes[0].expanded).toBeFalse();
        });

        it('collapse to initial view', () => {
            component.collapse();
            expect(component.nodes.length).toEqual(5);
            expect(component.nodes[0].element.idShort).toEqual('ExampleMotor');
            expect(component.nodes[0].expanded).toBeTrue();
            expect(component.nodes[1].element.idShort).toEqual('Identification');
            expect(component.nodes[2].element.idShort).toEqual('TechnicalData');
            expect(component.nodes[3].element.idShort).toEqual('OperationalData');
            expect(component.nodes[4].element.idShort).toEqual('Documentation');
        });
    });

    describe('expand', () => {
        it('expand submodel "Identification"', () => {
            expect(component.nodes.length).toEqual(9);
            expect(component.nodes[1].element.idShort).toEqual('Identification');
            expect(component.nodes[0].expanded).toBeTrue();
        });
    });

    describe('search text "max"', () => {
        let search: BehaviorSubject<string>;
        let store: AASTreeStore;

        beforeEach(() => {
            search = new BehaviorSubject<string>('');
            component.search = search.asObservable();

            component.ngOnChanges({
                search: new SimpleChange(null, search, true),
            });

            store = TestBed.inject(AASTreeStore);
        });

        it('the search text must be at least three characters long', (done: DoneFn) => {
            const subscription = store.selectMatchRow.pipe().subscribe(row => {
                if (row) {
                    expect(row.name).toEqual('MaxRotationSpeed');
                    subscription.unsubscribe();
                    done();
                }
            });

            search.next('z');
            search.next('zy');
            search.next('max');
        });

        it('finds the first occurrence of "max" at row 7', (done: DoneFn) => {
            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(7);
                done();
            });

            search.next('max');
        });

        it('finds the next occurrence of "max" at row 8', (done: DoneFn) => {
            search.next('max');
            component.findNext();

            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });

        it('finds the previous occurrence of "max" at row 25', (done: DoneFn) => {
            search.next('max');
            component.findPrevious();

            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });
    });

    describe('search pattern', () => {
        let search: BehaviorSubject<string>;
        let store: AASTreeStore;

        beforeEach(() => {
            search = new BehaviorSubject<string>('');
            component.search = search.asObservable();

            component.ngOnChanges({
                search: {
                    currentValue: search,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true,
                },
            });

            store = TestBed.inject(AASTreeStore);
        });

        it('finds the first occurrence of "#prop:max" at row 7', (done: DoneFn) => {
            search.next('#prop:max');

            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(7);
                done();
            });
        });

        it('finds the first occurrence of "#prop:MaxTorque" at row 8', (done: DoneFn) => {
            search.next('#prop:MaxTorque');

            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });

        it('finds the first occurrence of "#prop:serialnumber=P12345678I40" at row 5', (done: DoneFn) => {
            search.next('#prop:serialnumber=P12345678I40');

            store.selectMatchIndex.pipe(first()).subscribe(value => {
                expect(value).toEqual(5);
                done();
            });
        });
    });
});
