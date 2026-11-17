/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ChartComponent } from './chart.component';
import { DashboardApiService } from '../dashboard-api.service';
import { WebSocketService } from '../../../shared/services/web-socket.service';
import { createSpyObj, MockWebSocketService } from '../../../../test/mocks';

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
                provideTranslateService(),
            ],
            imports: [ChartComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ChartComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
