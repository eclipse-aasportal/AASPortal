/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { first, of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import { VIEW_ROUTES } from '../../../lib/types';
import { viewRoutes } from '../../../lib/views/views-routes';
import { TechnicalDataView } from '../../../lib/views/technical-data/technical-data-view';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { TechnicalData } from '../../../lib/views/technical-data/technical-data';
import { createSpyObj, FakeLoader } from '../../mocks';
import { TechnicalDataState } from '../../../lib/views/technical-data/technical-data.state';

import technicalData from '../../assets/technical-data-1-2.json';

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
    selector: 'fhg-technical-data',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestTechnicalData {
    public readonly document = input<AASDocument>();
    public readonly state = input<TechnicalDataState>();
}

describe('TechnicalDataView', () => {
    let component: TechnicalDataView;
    let fixture: ComponentFixture<TechnicalDataView>;
    let api: jest.Mocked<EndpointsApi>;
    let start: jest.Mocked<StartService>;
    let route: jest.Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = createSpyObj<StartService>(['add', 'save']);
        document = {
            address: '',
            crc32: 0,
            idShort: 'TechnicalDataAAS',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/aas/TechnicalData/1/2',
            endpoint: 'Test',
            content: technicalData as aas.Environment,
        };

        route = createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }) },
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
                    useValue: viewRoutes,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                TechnicalDataView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
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

    it('adds a favorite to the start page', (done) => {
        start.add.mockReturnValue(true);
        start.save.mockReturnValue(of(void 0));
        component.addToStart().pipe(first()).subscribe(() => {
            expect(start.add).toHaveBeenCalled();
            done();
        })
    });
});
