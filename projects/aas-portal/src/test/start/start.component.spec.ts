/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { StartService, ToolbarService } from 'aas-lib';
import { StartComponent } from '../../app/start/start.component';

describe('StartComponent', () => {
    let component: StartComponent;
    let fixture: ComponentFixture<StartComponent>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(async () => {
        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save'], {
            tiles: signal([]),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
                provideHttpClient(),
                provideHttpClientTesting(),
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

        fixture = TestBed.createComponent(StartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
