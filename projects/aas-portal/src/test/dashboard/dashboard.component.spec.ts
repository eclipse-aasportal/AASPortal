/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AuthService, NotifyService, WebSocketFactoryService, WindowService } from 'aas-lib';
import { WebSocketData } from 'aas-core';

import { DashboardComponent } from '../../app/dashboard/dashboard.component';
import { pages } from './test-pages';
import { SelectionMode } from '../../app/types/selection-mode';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';
import { WebSocketSubject } from 'rxjs/webSocket';
import { ToolbarService } from '../../app/toolbar.service';
import { DashboardChart } from '../../app/dashboard/dashboard.store';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let webSocketSubject: WebSocketSubject<WebSocketData>;
    let webSocketFactory: jasmine.SpyObj<WebSocketFactoryService>;
    let auth: jasmine.SpyObj<AuthService>;
    const chart1 = '42';
    const chart2 = '4711';
    // const chart3 = '0815';

    beforeEach(() => {
        webSocketSubject = new Subject<WebSocketData>() as unknown as WebSocketSubject<WebSocketData>;
        webSocketFactory = jasmine.createSpyObj<WebSocketFactoryService>(['create']);
        webSocketFactory.create.and.returnValue(webSocketSubject);

        auth = jasmine.createSpyObj<AuthService>(['checkCookie', 'getCookie', 'setCookie'], { userId: of('guest') });
        auth.checkCookie.and.returnValue(of(true));
        auth.setCookie.and.returnValue(of(void 0));
        auth.getCookie.and.callFake(name => {
            if (name === '.DashboardPage') {
                return of('Test');
            }

            return of(JSON.stringify(pages));
        });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: webSocketFactory,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: DashboardApiService,
                    useValue: jasmine.createSpyObj<DashboardApiService>(['getBlobValue']),
                },
                {
                    provide: WindowService,
                    useValue: jasmine.createSpyObj<WindowService>(['prompt']),
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set']),
                },
                provideRouter([]),
            ],
            imports: [
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
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the Test page', () => {
        expect(component.activePage()).toEqual('Test');
    });

    it('displays two rows', () => {
        expect(component.rows().length).toEqual(2);
    });

    describe('single selection', () => {
        it('supports single mode selection', () => {
            expect(component.selectionMode()).toEqual(SelectionMode.Single);
        });

        it('indicates no item selected', () => {
            expect(component.selectedItem).toBeNull();
            expect(component.selectedItems.length).toEqual(0);
        });

        it('allows to toggle the selection of a chart', () => {
            const rows = component.rows();
            component.toggleSelection(rows[0].columns[0]);
            expect(component.selectedItem).toEqual(rows[0].columns[0].item);
            expect(component.selectedItems.length).toEqual(1);
            component.toggleSelection(rows[0].columns[0]);
            expect(component.selectedItem).toBeNull();
            expect(component.selectedItems.length).toEqual(0);
        });

        it('ensures that only one item is selected', () => {
            const rows = component.rows();
            component.toggleSelection(rows[0].columns[0]);
            expect(component.selectedItem).toEqual(rows[0].columns[0].item);
            expect(component.selectedItems.length).toEqual(1);
            component.toggleSelection(rows[0].columns[1]);
            expect(component.selectedItem).toEqual(rows[0].columns[1].item);
            expect(component.selectedItems.length).toEqual(1);
        });
    });

    describe('view mode', () => {
        it('has a view mode (initial)', () => {
            expect(component.editMode()).toBeFalse();
        });
    });

    describe('edit mode', () => {
        beforeEach(() => {
            component.editMode.set(true);
        });

        it('has an edit mode', () => {
            expect(component.editMode()).toBeTrue();
        });

        it('can move item[0, 1] to the left', () => {
            component.toggleSelection(component.rows()[0].columns[1]);
            expect(component.canMoveLeft()).toBeTrue();
            component.moveLeft();

            expect(component.rows()[0].columns[0].id).toEqual(chart2);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect(component.rows()[0].columns[1].id).toEqual(chart2);
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect(component.rows()[0].columns[0].id).toEqual(chart2);
        });

        it('can move item[0, 0] to the right including undo/redo', () => {
            component.toggleSelection(component.rows()[0].columns[0]);
            expect(component.canMoveRight()).toBeTrue();
            component.moveRight();

            expect(component.rows()[0].columns[1].id).toEqual(chart1);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect(component.rows()[0].columns[0].id).toEqual(chart1);
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect(component.rows()[0].columns[1].id).toEqual(chart1);
        });

        it('can move item[0, 0] up creating a new row including undo/redo', () => {
            component.toggleSelection(component.rows()[0].columns[0]);
            expect(component.canMoveUp()).toBeTrue();
            component.moveUp();

            expect(component.rows()[0].columns[0].id).toEqual(chart1);
            expect(component.rows().length).toEqual(3);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect(component.rows()[0].columns[0].id).toEqual(chart1);
            expect(component.rows().length).toEqual(2);
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect(component.rows()[0].columns[0].id).toEqual(chart1);
            expect(component.rows().length).toEqual(3);
        });

        it('can move item[0, 0] down to [1, 1] including undo/redo', () => {
            component.toggleSelection(component.rows()[0].columns[0]);
            expect(component.canMoveDown()).toBeTrue();
            component.moveDown();

            expect(component.rows()[1].columns[1].id).toEqual(chart1);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect(component.rows()[0].columns[0].id).toEqual(chart1);
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect(component.rows()[1].columns[1].id).toEqual(chart1);
        });

        it('gets the color of a chart', () => {
            expect(component.getColor(component.rows()[0].columns[0])).toEqual('#123456');
        });

        it('sets the color of a chart including undo/redo', () => {
            component.changeColor(component.rows()[0].columns[0], '#AA55AA');

            expect((component.rows()[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#AA55AA');
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect((component.rows()[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#123456');
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect((component.rows()[0].columns[0].item as DashboardChart).sources[0].color).toEqual('#AA55AA');
        });

        it('gets the source labels of a chart', () => {
            expect(component.getSources(component.rows()[0].columns[0])).toEqual(['RotationSpeed']);
        });

        it('can delete the Test page', () => {
            const name = component.activePage();
            component.delete();
            expect(component.pages().find(item => item === name)).toBeUndefined();
        });

        it('can change the min value', () => {
            component.changeMin(component.rows()[0].columns[0], '0');

            expect((component.rows()[0].columns[0].item as DashboardChart).min).toEqual(0);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect((component.rows()[0].columns[0].item as DashboardChart).min).toBeUndefined();
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect((component.rows()[0].columns[0].item as DashboardChart).min).toEqual(0);
        });

        it('can change the max value', () => {
            component.changeMax(component.rows()[0].columns[0], '5500');

            expect((component.rows()[0].columns[0].item as DashboardChart).max).toEqual(5500);
            expect(component.canUndo()).toBeTrue();
            component.undo();

            expect((component.rows()[0].columns[0].item as DashboardChart).max).toBeUndefined();
            expect(component.canRedo()).toBeTrue();
            component.redo();

            expect((component.rows()[0].columns[0].item as DashboardChart).max).toEqual(5500);
        });
    });
});
