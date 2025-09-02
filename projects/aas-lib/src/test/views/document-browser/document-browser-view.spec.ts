/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';

import { AASDocument } from 'aas-core';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { encodeBase64Url } from '../../../lib/utilities';
import { BrowserComponent } from '../../../lib/components/browser/browser.component';
import { StartService } from '../../../lib/services/start.service';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { VIEW_ROUTES } from '../../../lib/types';
import { viewRoutes } from '../../../lib/views/views-routes';
import { DocumentBrowserView } from '../../../lib/views/document-browser/document-browser-view';
import { createSpyObj, FakeLoader } from '../../mocks';

@Component({
    selector: 'fhg-browser',
    template: '<div></div>',
    styles: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestBrowserComponent {
    public readonly document = input<AASDocument | null | undefined>(undefined);
}

describe('DocumentBrowserView', () => {
    let api: jest.Mocked<EndpointsApi>;
    let route: jest.Mocked<ActivatedRoute>;
    let start: jest.Mocked<StartService>;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument']);
        start = createSpyObj<StartService>(['add', 'save']);
        route = createSpyObj<ActivatedRoute>(
            {},
            { params: of({ endpoint: encodeBase64Url('endpoint'), id: encodeBase64Url('http://localhost/aas') }) },
        );

        api.getDocument.mockReturnValue(
            of({
                address: '',
                crc32: 0,
                idShort: '',
                readonly: false,
                timestamp: 0,
                id: 'http://localhost/aas',
                endpoint: 'endpoint',
            } satisfies AASDocument),
        );

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
                    useValue: viewRoutes,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                DocumentBrowserView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(DocumentBrowserView, {
            remove: {
                imports: [BrowserComponent],
            },
            add: {
                imports: [TestBrowserComponent],
            },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(DocumentBrowserView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
