/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppInfo } from 'aas-core';

import { AboutComponent } from '../../app/about/about.component';
import { AboutApiService } from '../../app/about/about-api.service';
import { ToolbarService } from '../../../../aas-lib/src/lib/toolbar.service';
import { signal } from '@angular/core';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    let api: jasmine.SpyObj<AboutApiService>;

    beforeEach(() => {
        const info: AppInfo = {
            name: 'Test',
            version: '1.0',
            author: 'FHG',
            description: '',
            license: '',
            homepage: '',
            libraries: [],
        };

        api = jasmine.createSpyObj<AboutApiService>(['getInfo', 'getMessages']);
        api.getInfo.and.returnValue(of(info));
        api.getMessages.and.returnValue(of([]));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AboutApiService,
                    useValue: api,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});