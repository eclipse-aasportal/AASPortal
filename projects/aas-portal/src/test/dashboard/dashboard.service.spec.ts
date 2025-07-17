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
import { of } from 'rxjs';
import { AuthService } from 'aas-lib';
import { DashboardService } from '../../app/dashboard/dashboard.service';

import data from '../assets/test-pages.json';

describe('DashboardService', () => {
    let service: DashboardService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie'], { ready: of(true) });
        auth.getCookie.and.returnValue(of(JSON.stringify(data)));

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
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(DashboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('returns the pages', () => {
        expect(service.pages().length).toBe(2);
    });

    it('returns the active page', () => {
        expect(service.activePage().name).toEqual('Test');
    });

    it('indicates that editMode is false', () => {
        expect(service.editMode()).toBeFalse();
    });

    it('gets a memento', () => {
        expect(service.getMemento()).toEqual(JSON.stringify(data));
    });

    it('sets a memento', () => {
        const data = [
            {
                name: 'Dashboard 1',
                items: [],
                requests: [],
                active: true,
            },
        ];

        service.setMemento(JSON.stringify(data));
        expect(service.toString(service.pages())).toEqual(JSON.stringify(data));
    });
});
