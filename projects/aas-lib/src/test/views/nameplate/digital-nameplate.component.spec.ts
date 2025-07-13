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

import { nameplate } from './digital-nameplate-document';
import { NameplateComponent } from '../../../lib/views/nameplate/nameplate.component';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { StartService } from '../../../lib/services/start.service';
import { encodeBase64Url } from '../../../lib/utilities';

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

describe('DigitalNameplateComponent', () => {
    let auth: jasmine.SpyObj<AuthService>;
    let api: jasmine.SpyObj<EndpointsApi>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        api = jasmine.createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url(nameplate.endpoint), id: encodeBase64Url(nameplate.id) }) },
        );

        api.getDocument.and.returnValue(of(nameplate));

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
                    provide: AuthService,
                    useValue: auth,
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
                NameplateComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(NameplateComponent, {
            remove: { imports: [SecuredImageComponent] },
            add: { imports: [TestSecuredImageComponent] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(NameplateComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('provides a "title"', () => {
        const fixture = TestBed.createComponent(NameplateComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.title()).toEqual('Nameplate');
    });
});
