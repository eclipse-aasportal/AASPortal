/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { first, lastValueFrom, of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { StartService } from '../../shared/services/start.service';
import { EndpointsApi } from '../../shared/services/endpoints-api';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { TechnicalDataView } from './technical-data-view';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { TechnicalData } from './technical-data';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { TechnicalDataState } from './technical-data.state';
import { TECHNICAL_DATA_1_2 } from '../views-constants';

import technicalData from '../../../test/assets/technical-data-1-2.json';

@Component({
    selector: 'fhg-thumbnail-qrcode',
    template: '<div></div>',
    styleUrls: [],
})
export class TestThumbnailQRCode {
    public readonly document = input<AASDocument>();
}

@Component({
    selector: 'fhg-technical-data',
    template: '<div></div>',
    styleUrls: [],
})
export class TestTechnicalData {
    public readonly document = input<AASDocument>();
    public readonly state = input<TechnicalDataState>();
}

describe('TechnicalDataView', () => {
    let component: TechnicalDataView;
    let fixture: ComponentFixture<TechnicalDataView>;
    let api: Mocked<EndpointsApi>;
    let start: Mocked<StartService>;
    let route: Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = createSpyObj<StartService>(['add', 'save']);
        document = {
            address: '',
            idShort: 'TechnicalDataAAS',
            timestamp: 0,
            id: 'https://admin-shell.io/aas/TechnicalData/1/2',
            endpoint: 'Test',
            content: technicalData as aas.Environment,
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
                            path: 'TechnicalData',
                            component: TechnicalDataView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [TECHNICAL_DATA_1_2],
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
            imports: [TechnicalDataView],
        }).compileComponents();

        TestBed.overrideComponent(TechnicalDataView, {
            remove: { imports: [TechnicalData, ThumbnailQRCode] },
            add: { imports: [TestTechnicalData, TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(TechnicalDataView);
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
        expect(component.technicalDataState).toBeInstanceOf(TechnicalDataState);
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
