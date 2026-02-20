/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { first, lastValueFrom, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { aas, AASDocument } from 'aas-core';

import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import { VIEW_ROUTES } from '../../../lib/views/views-routes';
import { HandoverDocumentationView } from '../../../lib/views/handover-documentation/handover-documentation-view';
import { HandoverDocumentation } from '../../../lib/views/handover-documentation/handover-documentation';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { createSpyObj, FakeLoader } from '../../mocks';
import { HandoverDocumentationState } from '../../../lib/views/handover-documentation/handover-documentation.state';
import { HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0 } from '../../../lib/views/views-constants';

import handoverDocumentation_1_2 from '../../assets/handover-documentation-1-2.json';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

@Component({
    selector: 'fhg-handover-documentation',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestHandoverDocumentation {
    public readonly document = input<AASDocument>();
    public readonly collapsed = input<boolean>();
    public readonly state = input<HandoverDocumentationState>();
}

describe('HandoverDocumentationView', () => {
    let fixture: ComponentFixture<HandoverDocumentationView>;
    let component: HandoverDocumentationView;
    let api: Mocked<EndpointsApi>;
    let start: Mocked<StartService>;
    let route: Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = createSpyObj<StartService>(['add', 'save']);
        document = {
            address: '',
            crc32: 0,
            idShort: 'HandoverDocumentation',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/HandoverDocumentation/1/2',
            endpoint: 'Test',
            content: handoverDocumentation_1_2 as aas.Environment,
        };

        route = createSpyObj<ActivatedRoute>(
            {},
            {
                params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }),
                queryParams: of({}),
            },
        );

        api.getDocument.mockReturnValue(of(document));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [
                        {
                            path: 'HandoverDocumentation',
                            component: HandoverDocumentationView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [HANDOVER_DOCUMENTATION_2_0, HANDOVER_DOCUMENTATION_1_2],
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
            imports: [HandoverDocumentationView],
        }).compileComponents();

        TestBed.overrideComponent(HandoverDocumentationView, {
            remove: { imports: [HandoverDocumentation, ThumbnailQRCode] },
            add: { imports: [TestHandoverDocumentation, TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(HandoverDocumentationView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a document', () => {
        expect(component.document()).toBe(document);
    });

    it('should provide the state for the HandoverDocumentation component', () => {
        expect(component.handoverDocumentationState).toBeInstanceOf(HandoverDocumentationState);
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
