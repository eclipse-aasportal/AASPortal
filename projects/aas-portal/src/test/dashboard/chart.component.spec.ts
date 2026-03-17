/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChartComponent } from '../../app/dashboard/chart/chart.component';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';
import { createSpyObj, FakeLoader, MockWebSocketService } from '../mocks';
import { WebSocketService } from 'aas-lib';

describe('ChartComponent', () => {
    let api: Mocked<DashboardApiService>;

    beforeEach(async () => {
        api = createSpyObj<DashboardApiService>(['getBlobValue']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: WebSocketService,
                    useValue: new MockWebSocketService(),
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
                        useClass: FakeLoader,
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
