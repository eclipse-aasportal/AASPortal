/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FavoriteComponent } from '../../../lib/components/favorite/favorite.component';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';
import { StartService } from '../../../lib/services/start.service';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { createSpyObj, FakeLoader } from '../../mocks';

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

describe('FavoriteComponent', () => {
    let api: jest.Mocked<EndpointsApi>;
    let auth: jest.Mocked<AuthService>;
    let start: jest.Mocked<StartService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { ready: of(true) });
        api = createSpyObj<EndpointsApi>(['getDocument']);
        start = createSpyObj<StartService>(['add', 'save']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                FavoriteComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(FavoriteComponent, {
            remove: { imports: [SecuredImageComponent] },
            add: { imports: [TestSecuredImageComponent] },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FavoriteComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
