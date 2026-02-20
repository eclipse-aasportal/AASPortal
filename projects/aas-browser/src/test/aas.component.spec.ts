/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { aas } from 'aas-core';
import { API_URL, BrowserComponent, BrowserState, ToolbarService } from 'aas-lib';

import { AASComponent } from '../app/aas/aas.component';
import { createSpyObj, FakeLoader } from './mocks';
import { ApiUrlService } from '../app/api-url.service';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { AASApi } from '../app/aas/aas-api';

@Component({
    selector: 'fhg-browser',
    template: '<div></div>',
    styles: [],
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestBrowserComponent {
    public readonly env = input<aas.Environment | null | undefined>(undefined);
    public readonly endpoint = input<string | null>(null);
    public readonly state = input<BrowserState>();
}

describe('AASComponent', () => {
    let component: AASComponent;
    let fixture: ComponentFixture<AASComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear']),
                },
                {
                    provide: API_URL,
                    useValue: createSpyObj<ApiUrlService>(['join']),
                },
                {
                    provide: AASApi,
                    useValue: {
                        env: {
                            value: signal({
                                assetAdministrationShells: [],
                                conceptDescriptions: [],
                                submodels: [],
                            } satisfies aas.Environment),
                        },
                    },
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
            imports: [],
        }).compileComponents();

        TestBed.overrideComponent(AASComponent, {
            remove: {
                imports: [BrowserComponent],
            },
            add: {
                imports: [TestBrowserComponent],
            },
        });

        fixture = TestBed.createComponent(AASComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
