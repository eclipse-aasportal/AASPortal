/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { StartService } from 'aas-lib';
import { StartState } from '../../app/start/start.state';
import { createSpyObj, FakeLoader } from '../mocks';

describe('StartState', () => {
    let service: StartState;
    let start: Mocked<StartService>;
    let sanitizer: Mocked<DomSanitizer>;

    beforeEach(() => {
        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save'], {
            tiles: signal([]),
        });

        sanitizer = createSpyObj<DomSanitizer>(['bypassSecurityTrustHtml']);
        sanitizer.bypassSecurityTrustHtml.mockImplementation(value => value as SafeHtml);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: DomSanitizer,
                    useValue: sanitizer,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideHttpClient(),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(StartState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('provides a list of favorites', () => {
        expect(service.welcome).toBeDefined();
    });

    it('provides the welcome page', () => {
        expect(service.items()).toEqual([]);
    });
});