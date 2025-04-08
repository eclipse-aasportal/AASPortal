/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location as NgLocation } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { WINDOW } from '../../../lib/services/window.service';
import { AuthService } from '../../../lib/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/secured-image/secured-image.component';
import { HandoverDocumentationComponent } from '../../../lib/views/handover-documentation/handover-documentation.component';
import { ToolbarService } from '../../../lib/services/toolbar.service';
import { StartService } from '../../../lib/services/start.service';
import { DocumentsService } from '../../../lib/services/documents.service';

import sample from '../../assets/dpp-sample.json';

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

describe('HandoverDocumentationComponent', () => {
    let component: HandoverDocumentationComponent;
    let fixture: ComponentFixture<HandoverDocumentationComponent>;

    let location: jasmine.SpyObj<NgLocation>;
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<DocumentsService>;
    let auth: jasmine.SpyObj<AuthService>;
    let start: jasmine.SpyObj<StartService>;

    beforeEach(async () => {
        location = jasmine.createSpyObj<NgLocation>(['getState']);
        location.getState.and.returnValue({ data: JSON.stringify([sample]) });
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        api = jasmine.createSpyObj<DocumentsService>(['getDocument', 'getContent']);
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
                    provide: DocumentsService,
                    useValue: api,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(HandoverDocumentationComponent, {
            remove: { imports: [SecuredImageComponent] },
            add: {
                providers: [],
                imports: [TestSecuredImageComponent],
            },
        });

        fixture = TestBed.createComponent(HandoverDocumentationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
