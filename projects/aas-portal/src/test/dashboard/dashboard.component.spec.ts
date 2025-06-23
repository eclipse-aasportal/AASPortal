/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component, input, signal } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketData } from 'aas-core';
import { NotifyService, StartService, WebSocketFactoryService, WINDOW, ToolbarService, WindowService } from 'aas-lib';

import { DashboardComponent } from '../../app/dashboard/dashboard.component';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartItem, DashboardState } from '../../app/dashboard/dashboard-types';
import { ChartEditComponent } from '../../app/dashboard/chart-edit/chart-edit.component';

import data from '../assets/test-pages.json';

@Component({
    selector: 'fhg-chart-edit',
    imports: [],
    template: '<div></div>',
    styles: [],
})
export class TestChartEditComponent {
    public readonly item = input.required<DashboardChartItem>();
}

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let webSocketSubject: WebSocketSubject<WebSocketData>;
    let webSocketFactory: jasmine.SpyObj<WebSocketFactoryService>;
    let start: jasmine.SpyObj<StartService>;
    let service: jasmine.SpyObj<DashboardService>;
    let window: jasmine.SpyObj<WindowService>;
    const chart1 = '42';
    const chart2 = '4711';
    const chart3 = '0815';

    beforeEach(() => {
        webSocketSubject = new Subject<WebSocketData>() as unknown as WebSocketSubject<WebSocketData>;
        webSocketFactory = jasmine.createSpyObj<WebSocketFactoryService>(['create']);
        webSocketFactory.create.and.returnValue(webSocketSubject);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);

        const pages: DashboardState = DashboardService.fromString(JSON.stringify(data));

        service = jasmine.createSpyObj<DashboardService>(
            ['getMemento', 'setMemento', 'save', 'updatePage', 'deletePage'],
            {
                editMode: signal(false),
                pages: signal(pages).asReadonly(),
                activePage: signal(pages[1]).asReadonly(),
            },
        );

        service.save.and.returnValue(EMPTY);

        window = jasmine.createSpyObj<WindowService>(['prompt', 'addEventListener', 'removeEventListener'], {
            innerWidth: 700,
        });

        TestBed.configureTestingModule({
            providers: [
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
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set']),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: DashboardService,
                    useValue: service,
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

        TestBed.overrideComponent(DashboardComponent, {
            add: {
                imports: [TestChartEditComponent],
            },
            remove: {
                imports: [ChartEditComponent],
            },
        });

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the Test page', () => {
        expect(component.activePage()?.name).toEqual('Test');
    });

    it('starts with 1 chart in first row', () => {
        expect(component.firstItems().length).toBe(1);
    });

    it('displays 2 charts per row', () => {
        expect(component.items().length).toBe(2);
    });

    describe('single selection', () => {
        it('indicates no item selected', () => {
            expect(component.selectedItem()).toBeUndefined();
            expect(component.selectedItems().length).toEqual(0);
        });

        it('allows to toggle the selection of a chart', () => {
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[0]);
            expect(component.selectedItem()).toEqual(items[0]);
            expect(component.selectedItems().length).toEqual(1);
            component.toggleSelection(undefined, items[0]);
            expect(component.selectedItem()).toBeUndefined();
            expect(component.selectedItems().length).toEqual(0);
        });

        it('ensures that only one item is selected', () => {
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[0]);
            expect(component.selectedItem()).toEqual(items[0]);
            expect(component.selectedItems().length).toEqual(1);
            component.toggleSelection(undefined, items[1]);
            expect(component.selectedItem()).toEqual(items[1]);
            expect(component.selectedItems().length).toEqual(1);
        });
    });

    describe('view mode', () => {
        it('has a view mode (initial)', () => {
            expect(component.editMode()).toBeFalse();
        });
    });

    describe('edit mode', () => {
        beforeEach(() => {
            service.editMode.set(true);
        });

        it('has an edit mode', () => {
            expect(component.editMode()).toBeTrue();
        });

        it('can move item[1] to the left', () => {
            let items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            expect(component.canMovePrevious()).toBeTrue();
            component.movePrevious();
            expect(service.updatePage).toHaveBeenCalled();
        });

        it('can move item[1] to the right', () => {
            let items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            expect(component.canMoveNext()).toBeTrue();
            component.moveNext();
            expect(service.updatePage).toHaveBeenCalled();
        });

        it('deletes the Test page', () => {
            component.delete();
            expect(service.deletePage).toHaveBeenCalled();
        });

        it('deletes a chart', () => {
            let items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            component.delete();
            expect(service.updatePage).toHaveBeenCalled();
        });
    });
});
