/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { first, lastValueFrom, of } from 'rxjs';
import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';

import { aas, AASDocument } from 'aas-core';
import { EndpointsApi } from '../../services/endpoints-api';
import { encodeBase64Url } from '../../utilities';
import { BrowserComponent } from '../../components/browser/browser.component';
import { StartService } from '../../services/start.service';
import { ToolbarService } from '../../services/toolbar.service';
import { VIEW_ROUTES } from '../views-routes';
import { DocumentBrowserView } from './document-browser-view';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { BrowserState } from '../../components/browser/browser.state';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';

import sampleDocument from '../../../test/assets/sample-document.json';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

@Component({
    selector: 'fhg-browser',
    template: '<div></div>',
    styles: [],
})
export class TestBrowserComponent {
    public readonly env = input<aas.Environment | null | undefined>(undefined);
    public readonly endpoint = input<string | null>(null);
    public readonly state = input<BrowserState>();
}

describe('DocumentBrowserView', () => {
    let fixture: ComponentFixture<DocumentBrowserView>;
    let component: DocumentBrowserView;
    let api: Mocked<EndpointsApi>;
    let route: Mocked<ActivatedRoute>;
    let start: Mocked<StartService>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument']);
        start = createSpyObj<StartService>(['add', 'save']);
        route = createSpyObj<ActivatedRoute>(
            {},
            {
                params: of({
                    endpoint: encodeBase64Url('endpoint'),
                    id: encodeBase64Url('http://customer.com/aas/9175_7013_7091_9168'),
                }),
                queryParams: of({}),
            },
        );

        document = {
            address: '',
            crc32: 0,
            idShort: 'ExampleMotor',
            readonly: false,
            timestamp: 0,
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            endpoint: 'endpoint',
            content: sampleDocument as aas.Environment,
        };

        api.getDocument.mockReturnValue(of(document));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [
                        {
                            path: 'Browser',
                            component: DocumentBrowserView,
                            data: {
                                type: 'Default',
                            },
                        },
                    ],
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [DocumentBrowserView],
        }).compileComponents();

        TestBed.overrideComponent(DocumentBrowserView, {
            remove: {
                imports: [BrowserComponent, ThumbnailQRCode],
            },
            add: {
                imports: [TestBrowserComponent, TestThumbnailQRCode],
            },
        });

        fixture = TestBed.createComponent(DocumentBrowserView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a document', () => {
        expect(component.document()).toBe(document);
    });

    it('provides a state for the Browser component', () => {
        expect(component.browserState).toBeDefined();
    });

    it('indicates that 1 document is available', () => {
        expect(component.count()).toBe(1);
    });

    it('shows the document with index 1', () => {
        expect(component.index()).toBe(1);
    });

    it('adds a favorite to the start page', async () => {
        start.add.mockReturnValue(true);
        start.save.mockReturnValue(of(void 0));
        await lastValueFrom(component.addToStart().pipe(first()));
        expect(start.add).toHaveBeenCalled();
    });
});
