/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { API_URL, ToolbarService } from 'aas-lib';

import { ShellsComponent } from '../app/shells/shells.component';
import { createSpyObj } from './mocks';
import { ShellsService } from '../app/shells.service';
import { Cursor } from '../app/types';
import { ApiUrlService } from '../app/api-url.service';

describe('ShellsComponent', () => {
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
                    }),
                },
                {
                    provide: API_URL,
                    useValue: createSpyObj<ApiUrlService>(['join']),
                },
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
            imports: [ShellsComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ShellsComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
