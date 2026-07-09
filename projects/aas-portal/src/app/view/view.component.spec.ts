/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ToolbarService, VIEW_ROUTES, viewRoutes } from 'aas-lib';

import { ViewComponent } from './view.component';
import { createSpyObj, FakeLoader } from '../../test/mocks';

describe('ViewComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: viewRoutes,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [ViewComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(ViewComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
