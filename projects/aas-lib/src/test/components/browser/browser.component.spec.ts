/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { BrowserComponent } from '../../../lib/components/browser/browser.component';
import { BrowserState } from '../../../lib/components/browser/browser.state';
import { createSpyObj, FakeLoader } from '../../mocks';
import { EndpointsApi } from '../../../lib/services/endpoints-api';

describe('BrowserComponent', () => {
    let fixture: ComponentFixture<BrowserComponent>;
    let component: BrowserComponent;
    let api: jest.Mocked<EndpointsApi>;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);

        await TestBed.configureTestingModule({
            imports: [BrowserComponent],
            providers: [
                BrowserState,
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BrowserComponent);
        fixture.componentRef.setInput('state', TestBed.inject(BrowserState));
        fixture.componentRef.setInput('document', document);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
