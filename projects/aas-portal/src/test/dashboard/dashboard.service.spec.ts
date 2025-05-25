/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { AuthService } from 'aas-lib';
import { of } from 'rxjs';

describe('DashboardService', () => {
    let service: DashboardService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie'], { userId: of('guest')});
        auth.getCookie.and.returnValue(of(undefined));

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
                    provide: AuthService,
                    useValue: auth,
                },
            ],
        });

        service = TestBed.inject(DashboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});