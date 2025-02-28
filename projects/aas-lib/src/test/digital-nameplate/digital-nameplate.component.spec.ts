/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { nameplate } from './digital-nameplate-document';
import { DigitalNameplateComponent } from '../../lib/digital-nameplate/digital-nameplate.component';
import { ToolbarService } from '../../lib/toolbar.service';
import { AuthService } from '../../lib/auth/auth.service';
import { of } from 'rxjs';
import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';
import { DigitalNameplateService } from '../../lib/digital-nameplate/digital-nameplate.service';

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
    let location: jasmine.SpyObj<Location>;
    let auth: jasmine.SpyObj<AuthService>;
    let api: jasmine.SpyObj<DigitalNameplateService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        api = jasmine.createSpyObj<DigitalNameplateService>(['getDocument', 'getContent']);
        location = jasmine.createSpyObj<Location>(['getState']);
        location.getState.and.returnValue({ data: JSON.stringify([nameplate]) });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: Location,
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
        });

        TestBed.overrideComponent(DigitalNameplateComponent, {
            remove: { providers: [DigitalNameplateService], imports: [SecuredImageComponent] },
            add: {
                providers: [{ provide: DigitalNameplateService, useValue: api }],
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
