/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JWTPayload, WebSocketData } from 'common';
import { first, of, Subject } from 'rxjs';
import { AASLibModule, NotifyService, AuthService, WebSocketFactoryService } from 'aas-lib';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

import { DashboardComponent } from '../../app/dashboard/dashboard.component';
import { TestWebSocketFactoryService } from '../../test/assets/test-web-socket-factory.service';
import { AppRoutingModule } from '../../app/app-routing.module';
import { dashboardReducer } from '../../app/dashboard/dashboard.reducer';
import { pages } from './test-pages';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { SelectionMode } from '../../app/types/selection-mode';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import * as DashboardActions from '../../app/dashboard/dashboard.actions';
import { DashboardChart, State } from '../../app/dashboard/dashboard.state';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let webSocketSubject: Subject<WebSocketData>;
    let store: Store<State>;
    let service: DashboardService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        webSocketSubject = new Subject<WebSocketData>();

        auth = jasmine.createSpyObj<AuthService>(['checkCookie', 'getCookie', 'setCookie'], {
            payload: of({ id: 'john.doe@email.com', role: 'editor', name: 'John' } as JWTPayload),
        });

        auth.checkCookie.and.returnValue(of(true));
        auth.getCookie.and.returnValue(of(JSON.stringify(pages)));

        TestBed.configureTestingModule({
            declarations: [DashboardComponent],
            providers: [
                {
                    provide: WebSocketFactoryService,
                    useValue: new TestWebSocketFactoryService(webSocketSubject),
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
            ],
            imports: [
                CommonModule,
                AppRoutingModule,
                HttpClientTestingModule,
                AASLibModule,
                EffectsModule.forRoot(),
                StoreModule.forRoot({
                    dashboard: dashboardReducer,
                }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        store = TestBed.inject(Store);
        service = TestBed.inject(DashboardService);

        store.dispatch(DashboardActions.setPages({ pages }));
        store.dispatch(DashboardActions.setPageName({ name: 'Test' }));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the Test page', function () {
        expect(component.page.name).toEqual('Test');
    });

    it('displays two rows', function () {
        expect(component.rows.length).toEqual(2);
    });

    describe('single selection', function () {
        it('supports single mode selection', function () {
            expect(component.selectionMode).toEqual(SelectionMode.Single);
        });

        it('indicates no item selected', function () {
            expect(component.selectedItem).toBeNull();
            expect(component.selectedItems.length).toEqual(0);
        });

        it('allows to toggle the selection of a chart', function () {
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.selectedItem).toEqual(component.rows[0].columns[0].item);
            expect(component.selectedItems.length).toEqual(1);
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.selectedItem).toBeNull();
            expect(component.selectedItems.length).toEqual(0);
        });

        it('ensures that only one item is selected', function () {
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.selectedItem).toEqual(component.rows[0].columns[0].item);
            expect(component.selectedItems.length).toEqual(1);
            component.toggleSelection(component.rows[0].columns[1]);
            expect(component.selectedItem).toEqual(component.rows[0].columns[1].item);
            expect(component.selectedItems.length).toEqual(1);
        });
    });

    describe('view mode', function () {
        it('has a view mode (initial)', function () {
            expect(component.editMode).toBeFalse();
        });
    });

    describe('edit mode', function () {
        beforeEach(function () {
            component.editMode = true;
        });

        it('has an edit mode', function () {
            expect(component.editMode).toBeTrue();
        });

        it('can move item[0, 1] to the left', function (done: DoneFn) {
            const id = component.rows[0].columns[1].id;
            component.toggleSelection(component.rows[0].columns[1]);
            expect(component.canMoveLeft()).toBeTrue();
            component.moveLeft();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[0].id).toEqual(id);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[1].id).toEqual(id);
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[0].id).toEqual(id);
                    done();
                });
        });

        it('can move item[0, 0] to the right including undo/redo', function (done: DoneFn) {
            const id = component.rows[0].columns[0].id;
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.canMoveRight()).toBeTrue();
            component.moveRight();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[1].id).toEqual(id);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[0].id).toEqual(id);
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[1].id).toEqual(id);
                    done();
                });
        });

        it('can move item[0, 0] up creating a new row including undo/redo', function (done: DoneFn) {
            const id = component.rows[0].columns[0].id;
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.canMoveUp()).toBeTrue();
            component.moveUp();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows.length).toEqual(3);
                    expect(rows[0].columns[0].id).toEqual(id);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows.length).toEqual(2);
                    expect(rows[0].columns[0].id).toEqual(id);
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows.length).toEqual(3);
                    expect(rows[0].columns[0].id).toEqual(id);
                    done();
                });
        });

        it('can move item[0, 0] down to [1, 1] including undo/redo', function (done: DoneFn) {
            const id = component.rows[0].columns[0].id;
            component.toggleSelection(component.rows[0].columns[0]);
            expect(component.canMoveDown()).toBeTrue();
            component.moveDown();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[1].columns[1].id).toEqual(id);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[0].columns[0].id).toEqual(id);
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect(rows[1].columns[1].id).toEqual(id);
                    done();
                });
        });

        it('gets the color of a chart', function () {
            expect(component.getColor(component.rows[0].columns[0])).toEqual('#123456');
        });

        it('sets the color of a chart including undo/redo', function (done: DoneFn) {
            component.changeColor(component.rows[0].columns[0], '#AA55AA');
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#AA55AA');
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#123456');
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#AA55AA');
                    done();
                });
        });

        it('gets the source labels of a chart', function () {
            expect(component.getSources(component.rows[0].columns[0])).toEqual(['RotationSpeed']);
        });

        it('can delete the Test page', function (done: DoneFn) {
            const name = component.page.name;
            component.delete();
            service.pages.pipe(first()).subscribe(pages => {
                expect(pages.find(item => item.name === name)).toBeUndefined();
                done();
            });
        });

        it('can change the min value', function (done: DoneFn) {
            component.changeMin(component.rows[0].columns[0], '0');
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).min).toEqual(0);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).min).toBeUndefined();
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).min).toEqual(0);
                    done();
                });
        });

        it('can change the max value', function (done: DoneFn) {
            component.changeMax(component.rows[0].columns[0], '5500');
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).max).toEqual(5500);
                });

            expect(component.canUndo()).toBeTrue();
            component.undo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).max).toBeUndefined();
                });

            expect(component.canRedo()).toBeTrue();
            component.redo();
            store
                .select(state => state.dashboard.rows)
                .pipe(first())
                .subscribe(rows => {
                    expect((rows[0].columns[0].item as DashboardChart).max).toEqual(5500);
                    done();
                });
        });
    });
});
