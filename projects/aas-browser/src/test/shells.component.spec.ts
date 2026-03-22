/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { API_URL, ToolbarService } from 'aas-lib';

import { ShellsComponent } from '../app/shells/shells.component';
import { createSpyObj, FakeLoader } from './mocks';
import { Cursor } from '../app/types';
import { ApiUrlService } from '../app/api-url.service';
import { ShellsService } from '../app/shells/shells.service';

describe('ShellsComponent', () => {
    let fixture: ComponentFixture<ShellsComponent>;
    let component: ShellsComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear']),
                },
                {
                    provide: ShellsService,
                    useValue: createSpyObj<ShellsService>([], {
                        limit: signal(30),
                        cursor: signal<Cursor | undefined>(undefined),
                        items: signal([]),
                    }),
                },
                {
                    provide: API_URL,
                    useValue: createSpyObj<ApiUrlService>(['join']),
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [ShellsComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(ShellsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
