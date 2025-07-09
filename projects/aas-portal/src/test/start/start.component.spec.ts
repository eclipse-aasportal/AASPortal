/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { StartService, ToolbarService } from 'aas-lib';
import { StartComponent } from '../../app/start/start.component';

describe('StartComponent', () => {
    let start: jasmine.SpyObj<StartService>;
    let sanitizer: jasmine.SpyObj<DomSanitizer>;

    beforeEach(async () => {
        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save'], {
            tiles: signal([]),
        });

        sanitizer = jasmine.createSpyObj<DomSanitizer>(['bypassSecurityTrustHtml']);
        sanitizer.bypassSecurityTrustHtml.and.callFake(value => value as SafeHtml);

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
                {
                    provide: DomSanitizer,
                    useValue: sanitizer,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [
                StartComponent,
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
        const fixture = TestBed.createComponent(StartComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('has a toolbar', () => {
        const fixture = TestBed.createComponent(StartComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.toolbarTemplate).toBeTruthy();
    });

    it('has inital an empty start page', () => {
        const fixture = TestBed.createComponent(StartComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.isEmpty()).toBe(true);
        expect(component.items()).toEqual([]);
    });
});
