/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AppInfo } from 'aas-core';
import { IndexChange, StartService, ToolbarService } from 'aas-lib';
import { AboutComponent } from '../../app/about/about.component';
import { AboutApiService } from '../../app/about/about-api.service';
import { createSpyObj, FakeLoader } from '../mocks';

describe('AboutComponent', () => {
    let api: Mocked<AboutApiService>;
    let start: Mocked<StartService>;
    let indexChange: Mocked<IndexChange>;

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

        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        start.save.mockReturnValue(of(void 0));

        api = createSpyObj<AboutApiService>(['getInfo', 'getMessages']);
        api.getInfo.mockReturnValue(of(info));
        api.getMessages.mockReturnValue(of([]));
        indexChange = createSpyObj<IndexChange>({}, { documentCount: signal(42), endpointCount: signal(2) });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: AboutApiService,
                    useValue: api,
                },
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: IndexChange,
                    useValue: indexChange,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [AboutComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AboutComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
