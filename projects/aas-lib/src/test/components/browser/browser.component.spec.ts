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
import { aas, AASDocument } from 'aas-core';
import { BrowserComponent } from '../../../lib/components/browser/browser.component';
import { BrowserState } from '../../../lib/components/browser/browser.state';
import { createSpyObj, FakeLoader } from '../../mocks';
import { EndpointsApi } from '../../../lib/services/endpoints-api';

import sampleDocument from '../../assets/sample-document.json';

describe('BrowserComponent', () => {
    let fixture: ComponentFixture<BrowserComponent>;
    let component: BrowserComponent;
    let api: jest.Mocked<EndpointsApi>;
    let document: AASDocument;
    let browserState: BrowserState;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);

        document = {
            address: '',
            crc32: 0,
            idShort: 'ExampleMotor',
            readonly: false,
            timestamp: 0,
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            endpoint: '',
            content: sampleDocument as aas.Environment,
        };

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
        browserState = TestBed.inject(BrowserState);
        fixture.componentRef.setInput('state', browserState);
        fixture.componentRef.setInput('document', document);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize the state with the AAS document', () => {
        expect(component.document()).toEqual(document);
        expect(component.state()).toBe(browserState);
        expect(component.path()).toEqual([]);
        expect(component.current()).toBeDefined();
        expect(component.current()?.name).toEqual('ExampleMotor');
        expect(component.children()?.length).toBeGreaterThan(0);
    });

    describe('goDown/gouUp', () => {
        it('should navigate down and up in the hierarchy', () => {
            const child = component.children()[0];
            component.goDown(child);
            expect(component.current()?.name).toEqual(child.name);

            const parent = component.path().at(-1);
            component.goUp(parent!);
            expect(component.current()?.referable).toBe(parent?.referable);
        });
    });
});
