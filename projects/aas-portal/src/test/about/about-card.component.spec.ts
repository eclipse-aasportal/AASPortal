/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { IndexChangeService } from 'aas-lib';
import { AboutCardComponent } from '../../app/about/about-card.component';

describe('AboutCardComponent', () => {
    let indexChange: jasmine.SpyObj<IndexChangeService>;

    beforeEach(async () => {
        indexChange = jasmine.createSpyObj<IndexChangeService>(
            {},
            { documentCount: signal(42), endpointCount: signal(2) },
        );

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: IndexChangeService,
                    useValue: indexChange,
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
        const fixture = TestBed.createComponent(AboutCardComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
