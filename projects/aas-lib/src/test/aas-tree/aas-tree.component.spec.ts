/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
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
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { aasTreeReducer } from '../../lib/aas-tree/aas-tree.reducer';
import { AASTreeFeatureState, AASTreeRow } from '../../lib/aas-tree/aas-tree.state';
import { selectMatchIndex, selectMatchRow, selectRows, selectTerms } from '../../lib/aas-tree/aas-tree.selectors';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SimpleChange } from '@angular/core';

describe('AASTreeComponent', () => {
    let component: AASTreeComponent;
    let fixture: ComponentFixture<AASTreeComponent>;
    let document: AASDocument;
    let webSocketSubject: Subject<WebSocketData>;
    let store: Store<AASTreeFeatureState>;

    beforeEach(() => {
        document = sampleDocument;
        webSocketSubject = new Subject<WebSocketData>();

        TestBed.configureTestingModule({
            declarations: [
                AASTreeComponent
            ],
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error', 'info', 'log'])
                },
                {
                    provide: DownloadService,
                    useValue: jasmine.createSpyObj<DownloadService>([
                        'downloadFileAsync',
                        'downloadDocument',
                        'uploadDocuments'])
                },
                {
                    provide: WindowService,
                    useValue: jasmine.createSpyObj<WindowService>([
                        'addEventListener',
                        'open',
                        'removeEventListener']),
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: new TestWebSocketFactoryService(webSocketSubject)
                }
            ],
            imports: [
                NgbModule,
                CommonModule,
                HttpClientTestingModule,
                StoreModule.forRoot(
                    {
                        tree: aasTreeReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(AASTreeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        store = TestBed.inject(Store);

        component.document = document;
        component.ngOnChanges({
            'document': new SimpleChange(null, document, true)
        });
    });

    afterEach(function () {
        webSocketSubject?.unsubscribe();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('gets the current document', function () {
        expect(component.document).toEqual(document);
    });

    it('indicates if document is online-ready', function () {
        expect(component.onlineReady).toEqual(document.onlineReady ? document.onlineReady : false);
    });

    it('indicates if document is read-only', function () {
        expect(component.readonly).toEqual(document.readonly);
    });

    it('indicates if the document is modified', function () {
        expect(component.modified).toEqual(document.modified ? document.modified : false);
    });

    it('shows the current offline state', function () {
        expect(component.state).toEqual('offline');
    });

    it('indicates if no node is selected', function (done: DoneFn) {
        component.someSelected.pipe(first()).subscribe(value => {
            expect(value).toBeFalse();
            done();
        })
    });

    it('shows the first level ExampleMotor', function (done: DoneFn) {
        component.nodes.pipe(first()).subscribe(nodes => {
            expect(nodes).toBeTruthy();
            expect(nodes.length).toEqual(5);
            expect(nodes[0].element.idShort).toEqual('ExampleMotor');
            expect(nodes[0].expanded).toBeTrue();
            expect(nodes[1].element.idShort).toEqual('Identification');
            expect(nodes[2].element.idShort).toEqual('TechnicalData');
            expect(nodes[3].element.idShort).toEqual('OperationalData');
            expect(nodes[4].element.idShort).toEqual('Documentation');
            done();
        });
    });


    describe('toggleSelection', function () {
        it('toggle selection of all rows', function (done: DoneFn) {
            component.toggleSelections();
            store.select(selectRows).pipe(first()).subscribe(values => {
                expect(values.every(value => value.selected)).toBeTrue();
                done();
            });
        });
    });

    describe('collapse', function () {
        let nodes: AASTreeRow[];

        beforeEach(function () {
            component.nodes.pipe(first()).subscribe(values => nodes = values);
        });

        it('collapse root element', function (done: DoneFn) {
            component.collapse(nodes[0]);
            component.nodes.pipe(first()).subscribe(values => {
                expect(values.length).toEqual(1);
                expect(values[0].element.idShort).toEqual('ExampleMotor');
                expect(values[0].expanded).toBeFalse();
                done();
            });
        });

        it('collapse to initial view', function () {
            component.collapse();
            component.nodes.pipe(first()).subscribe(values => {
                expect(values.length).toEqual(5);
                expect(values[0].element.idShort).toEqual('ExampleMotor');
                expect(values[0].expanded).toBeTrue();
                expect(values[1].element.idShort).toEqual('Identification');
                expect(values[2].element.idShort).toEqual('TechnicalData');
                expect(values[3].element.idShort).toEqual('OperationalData');
                expect(values[4].element.idShort).toEqual('Documentation');
            });
        });
    });

    describe('expand', function () {
        let nodes: AASTreeRow[];

        beforeEach(function () {
            component.nodes.pipe(first()).subscribe(values => nodes = values);
        });

        it('expand submodel "Identification"', function (done: DoneFn) {
            component.expand(nodes[1]);
            component.nodes.pipe(first()).subscribe(values => {
                expect(values.length).toEqual(9);
                expect(values[1].element.idShort).toEqual('Identification');
                expect(values[0].expanded).toBeTrue();
                done();
            });
        });
    });

    describe('search text "max"', function () {
        let search: BehaviorSubject<string>;
        let store: Store<AASTreeFeatureState>;

        beforeEach(function () {
            search = new BehaviorSubject<string>('');
            component.search = search.asObservable();

            component.ngOnChanges({
                'search': new SimpleChange(null, search, true)
            });

            store = TestBed.inject(Store);
        });

        it('the search text must be at least three characters long', function (done: DoneFn) {
            const subscription = store.select(selectMatchRow).pipe().subscribe(row => {
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

        it('finds the first occurrence of "max" at row 7', function (done: DoneFn) {
            search.next('max');

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(7);
                done();
            });
        });

        it('finds the next occurrence of "max" at row 8', function (done: DoneFn) {
            search.next('max');

            store.select(selectTerms).pipe(first()).subscribe(() => {
                component.findNext();
            });

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });

        it('finds the previous occurrence of "max" at row 25', function (done: DoneFn) {
            search.next('max');

            store.select(selectTerms).pipe(first()).subscribe(() => {
                component.findPrevious();
            });

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });
    });

    describe('search pattern', function () {
        let search: BehaviorSubject<string>;
        let store: Store<AASTreeFeatureState>;

        beforeEach(function () {
            search = new BehaviorSubject<string>('');
            component.search = search.asObservable();

            component.ngOnChanges({
                'search': {
                    currentValue: search,
                    previousValue: null,
                    firstChange: true,
                    isFirstChange: () => true
                }
            });

            store = TestBed.inject(Store);
        });

        it('finds the first occurrence of "#prop:max" at row 7', function (done: DoneFn) {
            search.next('#prop:max');

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(7);
                done();
            });
        });

        it('finds the first occurrence of "#prop:MaxTorque" at row 8', function (done: DoneFn) {
            search.next('#prop:MaxTorque');

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(8);
                done();
            });
        });

        it('finds the first occurrence of "#prop:serialnumber=P12345678I40" at row 5', function (done: DoneFn) {
            search.next('#prop:serialnumber=P12345678I40');

            store.select(selectMatchIndex).pipe(first()).subscribe(value => {
                expect(value).toEqual(5);
                done();
            });
        });
    });
});