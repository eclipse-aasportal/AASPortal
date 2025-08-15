/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';

import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import { VIEW_ROUTES } from '../../../lib/types';
import { viewRoutes } from '../../../lib/views/views-routes';
import { ThumbnailQRCode } from '../../../lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { ContactInformationView } from '../../../lib/views/contact-information/contact-information.view';
import { ContactInformation } from '../../../lib/views/contact-information/contact-information';

import contactInformation from '../../assets/contact-information-1-0.json';
import { FakeLoader } from '../../mocks';

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

describe('ContactInformationsView', () => {
    let component: ContactInformationView;
    let fixture: ComponentFixture<ContactInformationView>;
    let api: jasmine.SpyObj<EndpointsApi>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;
    let document: AASDocument;

    beforeEach(async () => {
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
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

        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }) },
        );

        api.getDocument.and.returnValue(of(document));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
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
                ContactInformationView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
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
});
