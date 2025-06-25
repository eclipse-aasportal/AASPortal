/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AppInfo } from 'aas-core';
import { IndexChangeService, StartService, ToolbarService } from 'aas-lib';
import { AboutComponent } from '../../app/about/about.component';
import { AboutApiService } from '../../app/about/about-api.service';

describe('AboutComponent', () => {
    let api: jasmine.SpyObj<AboutApiService>;
    let start: jasmine.SpyObj<StartService>;
    let indexChange: jasmine.SpyObj<IndexChangeService>;

    beforeEach(async () => {
        const info: AppInfo = {
            name: 'Test',
            version: '1.0',
            author: 'FHG',
            description: '',
            license: '',
            homepage: '',
            libraries: [],
        };

        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        start.save.and.returnValue(of(void 0))

        api = jasmine.createSpyObj<AboutApiService>(['getInfo', 'getMessages']);
        api.getInfo.and.returnValue(of(info));
        api.getMessages.and.returnValue(of([]));
        indexChange = jasmine.createSpyObj<IndexChangeService>(
            {},
            { documentCount: signal(42), endpointCount: signal(2) },
        );

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: AboutApiService,
                    useValue: api,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: IndexChangeService,
                    useValue: indexChange,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                AboutComponent,
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
        const fixture = TestBed.createComponent(AboutComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
