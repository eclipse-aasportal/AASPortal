/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ToolbarService, WebSocketFactoryService, WINDOW, WindowService } from 'aas-lib';

import { MainComponent } from '../app/main/main.component';
import { createSpyObj, FakeLoader } from './mocks';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

describe('MainComponent', () => {
    let fixture: ComponentFixture<MainComponent>;
    let component: MainComponent;
    let location: Mocked<Location>;

    beforeEach(async () => {
        location = createSpyObj<Location>(['toString'], { origin: 'http://localhost/aas/server' });
        location.toString.mockReturnValue('http://localhost/aas/server');

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: WINDOW,
                    useValue: createSpyObj<WindowService>([], { location }),
                },
                {
                    provide: WebSocketFactoryService,
                    useValue: { create: vi.fn(() => new Subject()) },
                },
                provideTranslateService({ loader: { provide: TranslateLoader, useClass: FakeLoader } }),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
            imports: [MainComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
