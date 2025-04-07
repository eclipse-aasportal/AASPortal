/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { nameplate } from './digital-nameplate-document';
import { DigitalNameplateComponent } from '../../../lib/views/digital-nameplate/digital-nameplate.component';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { AuthService } from '../../../lib/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/secured-image/secured-image.component';
import { DocumentsService } from '../../../lib/services/documents.service';
import { StartService } from '../../../lib/services/start.service';
import { encodeBase64Url } from '../../../lib/utilities';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    standalone: true,
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
    let component: DigitalNameplateComponent;
    let fixture: ComponentFixture<DigitalNameplateComponent>;
    let auth: jasmine.SpyObj<AuthService>;
    let api: jasmine.SpyObj<DocumentsService>;
    let start: jasmine.SpyObj<StartService>;
    let route: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        api = jasmine.createSpyObj<DocumentsService>(['getDocument', 'getContent']);
        start = jasmine.createSpyObj<StartService>(['add', 'save']);
        route = jasmine.createSpyObj<ActivatedRoute>(
            {},
            { queryParams: of({ endpoint: encodeBase64Url(nameplate.endpoint), id: encodeBase64Url(nameplate.id) }) },
        );

        api.getDocument.and.returnValue(of(nameplate));

        TestBed.configureTestingModule({
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
                    provide: DocumentsService,
                    useValue: api,
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        TestBed.overrideComponent(DigitalNameplateComponent, {
            remove: { imports: [SecuredImageComponent] },
            add: {
                imports: [TestSecuredImageComponent],
            },
        });

        fixture = TestBed.createComponent(DigitalNameplateComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a "title"', () => {
        expect(component.title()).toEqual('Nameplate');
    });
});
