/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { Location as NgLocation } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { WINDOW } from '../../../lib/services/window.service';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';
import { HandoverDocumentationView } from '../../../lib/views/handover-documentation/handover-documentation.view';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';

import sample from '../../assets/dpp-sample.json';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSecuredImageComponent {
    public readonly src = input<string>('');
    public readonly alt = input<string | undefined>();
    public readonly class = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

describe('HandoverDocumentationComponent', () => {
    let location: jasmine.SpyObj<NgLocation>;
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<EndpointsApi>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(async () => {
        location = jasmine.createSpyObj<NgLocation>(['getState']);
        location.getState.and.returnValue({ data: JSON.stringify([sample]) });
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { ready: of(true) });
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        window = jasmine.createSpyObj<Window>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgLocation,
                    useValue: location,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) }),
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
            imports: [
                HandoverDocumentationView,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(HandoverDocumentationView, {
            remove: { imports: [SecuredImageComponent] },
            add: { imports: [TestSecuredImageComponent] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(HandoverDocumentationView);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
