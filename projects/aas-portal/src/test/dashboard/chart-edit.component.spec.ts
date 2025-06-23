/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { NotifyService } from 'aas-lib';
import { ChartEditComponent } from '../../app/dashboard/chart-edit/chart-edit.component';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardState } from '../../app/dashboard/dashboard-types';

import data from '../assets/test-pages.json';

describe('ChartEditComponent', () => {
    let component: ChartEditComponent;
    let fixture: ComponentFixture<ChartEditComponent>;
    let service: jasmine.SpyObj<DashboardService>;

    beforeEach(async () => {
        const pages: DashboardState = DashboardService.fromString(JSON.stringify(data));

        service = jasmine.createSpyObj<DashboardService>(['getMemento', 'setMemento', 'updatePage', 'save'], {
            editMode: signal(false),
            pages: signal(pages).asReadonly(),
            activePage: signal(pages[1]).asReadonly(),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: DashboardService,
                    useValue: service,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChartEditComponent);
        component = fixture.componentInstance;
        const componentRef = fixture.componentRef;
        componentRef.setInput('item', pages[1].items[0]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('gets the color of a chart', () => {
        expect(component.getColor(component.item())).toEqual('#123456');
    });

    it('sets the color of a chart including undo/redo', () => {
        component.changeColor(component.item(), '#AA55AA');
        expect(service.updatePage).toHaveBeenCalled();
    });

    it('gets the source labels of a chart', () => {
        expect(component.item().sources.map(source => source.label)).toEqual(['RotationSpeed']);
    });

    it('changes the min value', () => {
        component.changeMin(component.item(), '0');
        expect(service.updatePage).toHaveBeenCalled();
    });

    it('changes the max value', () => {
        component.changeMax(component.item(), '5500');
        expect(service.updatePage).toHaveBeenCalled();
    });
});
