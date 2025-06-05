/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebSocketFactoryService } from 'aas-lib';
import { DashboardCardComponent } from '../../app/dashboard/dashboard-card/dashboard-card.component';
import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';

describe('DashboardCardComponent', () => {
    let component: DashboardCardComponent;
    let fixture: ComponentFixture<DashboardCardComponent>;
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
            ],
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
