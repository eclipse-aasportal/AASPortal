/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardStore } from '../../app/dashboard/dashboard.store';

describe('DashboardService', () => {
    let service: DashboardService;
    let store: jasmine.SpyObj<DashboardStore>;

    beforeEach(() => {
        store = jasmine.createSpyObj<DashboardStore>(['getPage'], { pages: [] });

        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [
                {
                    provide: DashboardStore,
                    useValue: store,
                },
            ],
        });

        service = TestBed.inject(DashboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
