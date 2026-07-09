/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { EndpointsApi } from '../../services/endpoints-api';
import { encodeBase64Url } from '../../utilities';
import { VIEW_ROUTES } from '../views-routes';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { ContactInformationView } from './contact-information-view';
import { ContactInformation } from './contact-information';
import { ContactInformationState } from './contact-information.state';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { CONTACT_INFORMATION_1_0 } from '../views-constants';

import contactInformation from '../../../test/assets/contact-information-1-0.json';

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
    selector: 'fhg-contact-information',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestContactInformation {
    public readonly document = input<AASDocument>();
}

describe.skip('ContactInformationsView', () => {
    let component: ContactInformationView;
    let fixture: ComponentFixture<ContactInformationView>;
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
            idShort: 'ContactInformationAAS',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/ContactInformation/1/0',
            endpoint: 'Test',
            content: contactInformation as aas.Environment,
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
                    useValue: [
                        {
                            path: 'ContactInformation',
                            component: ContactInformationView,
                            data: {
                                type: 'Leaf',
                                semanticIds: [CONTACT_INFORMATION_1_0],
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
            imports: [ContactInformationView],
        }).compileComponents();

        TestBed.overrideComponent(ContactInformationView, {
            remove: { imports: [ContactInformation, ThumbnailQRCode] },
            add: { imports: [TestContactInformation, TestThumbnailQRCode] },
        });

        fixture = TestBed.createComponent(ContactInformationView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a document', () => {
        expect(component.document()).toBe(document);
    });

    it('should provide a state for the CarbonFootprint component', () => {
        expect(component.contactInformationState).toBeInstanceOf(ContactInformationState);
    });
});
