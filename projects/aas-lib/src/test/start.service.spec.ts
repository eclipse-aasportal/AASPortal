/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { START_TILE_TYPES, StartService } from '../lib/start.service';
import { AuthService } from '../lib/auth/auth.service';

describe('StartService', () => {
    let service: StartService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        auth.getCookie.and.returnValue(of(undefined));
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: START_TILE_TYPES,
                    useValue: [],
                },
                {
                    provide: AuthService,
                    useValue: auth,
                }
            ],
        });
        service = TestBed.inject(StartService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
