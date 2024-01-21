/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { Message } from 'common';
import { first } from 'rxjs';
import { messageTableReducer } from '../../lib/message-table/massage-table.reducer';
import { MessageTableComponent } from '../../lib/message-table/message-table.component';
import { MessageTableFeatureState } from '../../lib/message-table/message-table.state';
import { SortableHeaderDirective } from '../../public-api';

describe('MessageTableComponent', () => {
    let component: MessageTableComponent;
    let fixture: ComponentFixture<MessageTableComponent>;
    let collection: Message[];
    const sizePerType = 5;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                MessageTableComponent,
                SortableHeaderDirective
            ],
            providers: [],
            imports: [
                CommonModule,
                NgbModule,
                StoreModule.forRoot(
                    {
                        messageTable: messageTableReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(MessageTableComponent);
        component = fixture.componentInstance;

        collection = [];
        for (let i = 1; i <= sizePerType; i++) {
            collection.push({
                type: 'Info',
                timestamp: Date.now(),
                text: 'Info' + i
            });
            collection.push({
                type: 'Warning',
                timestamp: Date.now(),
                text: 'Warning' + i
            });
            collection.push({
                type: 'Error',
                timestamp: Date.now(),
                text: 'Error' + i
            });
        }

        component.collection = collection;
        fixture.detectChanges();

        component.ngOnChanges({
            "collection": new SimpleChange([], collection, true)
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('has an initial page size of 10', function () {
        expect(component.pageSize).toEqual(10);
    });

    it('shows page 1', function () {
        expect(component.page).toEqual(1);
    });

    it('provides a collection with all messages (5 errors, 5 warnings, 5 info)', function () {
        expect(component.collection.length).toEqual(3 * sizePerType);
    });

    it('shows initial only errors', function () {
        expect(component.showError).toBeTrue();
        expect(component.showInfo).toBeFalse();
        expect(component.showWarning).toBeFalse();
    });

    it('supports 3 sortable headers', function () {
        expect(component.headers?.length).toEqual(3);
    });

    describe('show only errors', function () {
        beforeEach(function () {
            if (!component.showError) {
                component.toggleShowError();
            }

            if (component.showInfo) {
                component.toggleShowInfo();
            }

            if (component.showWarning) {
                component.toggleShowWarning();
            }

            fixture.detectChanges();
        });

        it('shows only errors', function () {
            expect(component.size).toEqual(sizePerType);
            expect(component.messages.every(message => message.type === 'Error')).toBeTrue();
        });

        it('hides the pagination', function () {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show only warnings', function () {
        beforeEach(function () {
            if (component.showError) {
                component.toggleShowError();
            }

            if (component.showInfo) {
                component.toggleShowInfo();
            }

            if (!component.showWarning) {
                component.toggleShowWarning();
            }

            fixture.detectChanges();
        });

        it('shows only warnings', function () {
            expect(component.size).toEqual(sizePerType);
            expect(component.messages.every(message => message.type === 'Warning')).toBeTrue();
        });

        it('hides the pagination', function () {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show only info', function () {
        beforeEach(function () {
            if (component.showError) {
                component.toggleShowError();
            }

            if (!component.showInfo) {
                component.toggleShowInfo();
            }

            if (component.showWarning) {
                component.toggleShowWarning();
            }

            fixture.detectChanges();
        });

        it('shows only info', function () {
            expect(component.size).toEqual(sizePerType);
            expect(component.messages.every(message => message.type === 'Info')).toBeTrue();
        });

        it('hides the pagination', function () {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeNull();
        });
    });

    describe('show all messages', function () {
        beforeEach(function () {
            if (!component.showError) {
                component.toggleShowError();
            }

            if (!component.showInfo) {
                component.toggleShowInfo();
            }

            if (!component.showWarning) {
                component.toggleShowWarning();
            }
        });

        it('shows all messages', function () {
            expect(component.size).toEqual(3 * sizePerType);
        });

        it('shows the pagination', function () {
            const element: HTMLElement = fixture.debugElement.nativeElement;
            const pagination: HTMLElement = element.querySelector('ngb-pagination')!;
            expect(pagination).toBeDefined();
        });

        it('provides 2 pages (10, 5)', function () {
            expect(component.page).toEqual(1);
            expect(component.messages).toEqual(component.collection.slice(0, 10));

            component.page = 2;
            fixture.detectChanges();
            component.refreshMessages();
            expect(component.messages).toEqual(component.collection.slice(-5));
        });
    });

    describe('sorting', function () {
        let store: Store<MessageTableFeatureState>;

        beforeEach(function () {
            store = TestBed.inject(Store);

            if (!component.showError) {
                component.toggleShowError();
            }

            if (!component.showInfo) {
                component.toggleShowInfo();
            }

            if (!component.showWarning) {
                component.toggleShowWarning();
            }
        });

        it('shows the origin order', function (done: DoneFn) {
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('');
                expect(state.direction).toEqual('');
                done();
            });
        });

        it('can sort type column in ascending order', function (done: DoneFn) {
            component.onSort({ column: 'type', direction: 'asc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('type');
                expect(state.direction).toEqual('asc');
                done();
            });
        });

        it('can sort type column in descending order', function (done: DoneFn) {
            component.onSort({ column: 'type', direction: 'desc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('type');
                expect(state.direction).toEqual('desc');
                done();
            });
        });

        it('can sort timestamp column in ascending order', function (done: DoneFn) {
            component.onSort({ column: 'timestamp', direction: 'asc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('timestamp');
                expect(state.direction).toEqual('asc');
                done();
            });
        });

        it('can sort timestamp column in descending order', function (done: DoneFn) {
            component.onSort({ column: 'timestamp', direction: 'desc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('timestamp');
                expect(state.direction).toEqual('desc');
                done();
            });
        });

        it('can sort text column in ascending order', function (done: DoneFn) {
            component.onSort({ column: 'text', direction: 'asc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('text');
                expect(state.direction).toEqual('asc');
                done();
            });
        });

        it('can sort text column in descending order', function (done: DoneFn) {
            component.onSort({ column: 'text', direction: 'desc' });
            store.select(state => state.messageTable).pipe(first()).subscribe(state => {
                expect(state.showError).toBeTrue();
                expect(state.showInfo).toBeTrue();
                expect(state.showWarning).toBeTrue();
                expect(state.column).toEqual('text');
                expect(state.direction).toEqual('desc');
                done();
            });
        });
    });
});