/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { aas, AASDocument } from 'aas-core';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { StartService } from '../../../lib/services/start.service';
import { encodeBase64Url } from '../../../lib/utilities';
import { Nameplate, NameplateView, ThumbnailQRCode } from '../../../lib/internal';

import nameplate_3_0 from '../../assets/nameplate-3-0.json';

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
    selector: 'fhg-nameplate',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestNameplate {
    public readonly document = input<AASDocument>();
}

describe('NameplateView', () => {
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
            idShort: 'DigitalNameplate',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/DigitalNameplate/3/0',
            endpoint: 'Test',
            content: nameplate_3_0 as aas.Environment,
        };

        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url(document.endpoint), id: encodeBase64Url(document.id) }) },
        );

        api.getDocument.and.returnValue(of(document));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: route,
                },
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
                provideZonelessChangeDetection(),
            ],
            imports: [
                NameplateView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(NameplateView, {
            remove: { imports: [Nameplate, ThumbnailQRCode] },
            add: { imports: [TestNameplate, TestThumbnailQRCode] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(NameplateView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
