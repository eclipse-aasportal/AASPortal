/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { HierarchicalStructureView } from '../../../lib/views/hierarchical-structure/hierarchical-structure-view';
import { HierarchicalStructure } from '../../../lib/views/hierarchical-structure/hierarchical-structure';
import { createSpyObj, FakeLoader } from '../../mocks';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { StartService } from '../../../lib/services/start.service';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import { VIEW_ROUTES } from '../../../lib/views/views-routes';
import { HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1 } from '../../../lib/views/views-constants';

import hierarchicalStructures_1_1 from '../../assets/hierarchical-structures-1-1.json';

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
    selector: 'fhg-hierarchical-structure',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestHierarchicalStructure {
    public readonly document = input<AASDocument>();
    public readonly submodel = input<aas.Submodel>();
}

describe('HierarchicalStructureView', () => {
    let component: HierarchicalStructureView;
    let fixture: ComponentFixture<HierarchicalStructureView>;
    let start: jest.Mocked<StartService>;
    let api: jest.Mocked<EndpointsApi>;
    let route: jest.Mocked<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        start = createSpyObj<StartService>(['add', 'save']);
        document = {
            address: '',
            crc32: 0,
            idShort: 'BillofMaterialAAS',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/HierarchicalStructuresBoM/1/1',
            endpoint: 'Test',
            content: hierarchicalStructures_1_1 as aas.Environment,
        };

        route = createSpyObj<ActivatedRoute>(
            {},
            {
                params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }),
                queryParams: of({}),
            },
        );

        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
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
                            path: 'HierarchicalStructure',
                            component: HierarchicalStructureView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [HIERARCHICAL_STRUCTURES_1_0, HIERARCHICAL_STRUCTURES_1_1],
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
            imports: [HierarchicalStructureView],
        }).compileComponents();

        TestBed.overrideComponent(HierarchicalStructureView, {
            remove: { imports: [HierarchicalStructure, ThumbnailQRCode] },
            add: { imports: [TestHierarchicalStructure, TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(HierarchicalStructureView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
