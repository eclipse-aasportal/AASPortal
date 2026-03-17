/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { EMPTY, Subject } from 'rxjs';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketData } from 'aas-core';
import { NotifyService, StartService, WebSocketService, WINDOW, ToolbarService, WindowService } from 'aas-lib';

import { DashboardComponent } from '../../app/dashboard/dashboard.component';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartItem, DashboardState } from '../../app/dashboard/dashboard-types';
import { ChartEditComponent } from '../../app/dashboard/chart-edit/chart-edit.component';

import data from '../assets/test-pages.json';
import { createSpyObj, FakeLoader, MockWebSocketService } from '../mocks';

@Component({
    selector: 'fhg-chart-edit',
    imports: [],
    template: '<div></div>',
    styles: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestChartEditComponent {
    public readonly item = input.required<DashboardChartItem>();
}

describe('DashboardComponent', () => {
    let start: Mocked<StartService>;
    let service: Mocked<DashboardService>;
    let window: Mocked<WindowService>;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'save']);

        vi.useFakeTimers

        HTMLCanvasElement.prototype.getContext = () => {
            return null;
        };

        const pages: DashboardState = DashboardService.fromString(JSON.stringify(data));

        service = createSpyObj<DashboardService>(['getMemento', 'setMemento', 'save', 'updatePage', 'deletePage'], {
            editMode: signal(false),
            pages: signal(pages).asReadonly(),
            activePage: signal(pages[1]).asReadonly(),
        });

        service.save.mockReturnValue(EMPTY);

        window = createSpyObj<WindowService>(['prompt', 'addEventListener', 'removeEventListener'], {
            innerWidth: 700,
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: WebSocketService,
                    useValue: new MockWebSocketService(),
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: DashboardApiService,
                    useValue: createSpyObj<DashboardApiService>(['getBlobValue']),
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['clear', 'set']),
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
                provideZonelessChangeDetection(),
                provideTranslateService({
                    fallbackLang: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [],
        }).compileComponents();

        TestBed.overrideComponent(DashboardComponent, {
            add: {
                imports: [TestChartEditComponent],
            },
            remove: {
                imports: [ChartEditComponent],
            },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(DashboardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('shows the Test page', () => {
        const fixture = TestBed.createComponent(DashboardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.activePage()?.name).toEqual('Test');
    });

    it('starts with 1 chart in first row', () => {
        const fixture = TestBed.createComponent(DashboardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.firstItems().length).toBe(1);
    });

    it('displays 2 charts per row', () => {
        const fixture = TestBed.createComponent(DashboardComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.items().length).toBe(2);
    });

    describe('single selection', () => {
        it('indicates no item selected', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.selectedItem()).toBeUndefined();
            expect(component.selectedItems().length).toEqual(0);
        });

        it('allows to toggle the selection of a chart', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[0]);
            expect(component.selectedItem()).toEqual(items[0]);
            expect(component.selectedItems().length).toEqual(1);
            component.toggleSelection(undefined, items[0]);
            expect(component.selectedItem()).toBeUndefined();
            expect(component.selectedItems().length).toEqual(0);
        });

        it('ensures that only one item is selected', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
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
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.editMode()).toBe(false);
        });
    });

    describe('edit mode', () => {
        beforeEach(() => {
            service.editMode.set(true);
        });

        it('has an edit mode', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.editMode()).toBe(true);
        });

        it('can move item[1] to the left', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            expect(component.canMovePrevious()).toBe(true);
            component.movePrevious();
            expect(service.updatePage).toHaveBeenCalled();
        });

        it('can move item[1] to the right', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            expect(component.canMoveNext()).toBe(true);
            component.moveNext();
            expect(service.updatePage).toHaveBeenCalled();
        });

        it('deletes the Test page', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            component.delete();
            expect(service.deletePage).toHaveBeenCalled();
        });

        it('deletes a chart', () => {
            const fixture = TestBed.createComponent(DashboardComponent);
            const component = fixture.componentInstance;
            fixture.detectChanges();
            const items = component.activePage().items;
            component.toggleSelection(undefined, items[1]);
            component.delete();
            expect(service.updatePage).toHaveBeenCalled();
        });
    });
});
