/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WebSocketFactoryService } from 'aas-lib';
import { ChartComponent } from '../../app/dashboard/chart/chart.component';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';

describe('ChartComponent', () => {
    let webSocketFactory: jasmine.SpyObj<WebSocketFactoryService>;
    let api: jasmine.SpyObj<DashboardApiService>;

    beforeEach(async () => {
        webSocketFactory = jasmine.createSpyObj<WebSocketFactoryService>(['create']);
        api = jasmine.createSpyObj<DashboardApiService>(['getBlobValue']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: WebSocketFactoryService,
                    useValue: webSocketFactory,
                },
                {
                    provide: DashboardApiService,
                    useValue: api,
                },
                provideZonelessChangeDetection(),
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
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ChartComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
