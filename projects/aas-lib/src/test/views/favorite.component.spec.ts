/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { FavoriteComponent } from '../../lib/views/favorite/favorite.component';
import { FavoriteApiService } from '../../lib/views/favorite/favorite-api.service';
import { AuthService } from '../../lib/auth/auth.service';
import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';

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

describe('FavoriteComponent', () => {
    let component: FavoriteComponent;
    let fixture: ComponentFixture<FavoriteComponent>;
    let api: jasmine.SpyObj<FavoriteApiService>;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(async () => {
        auth = jasmine.createSpyObj<AuthService>(['getCookie', 'setCookie', 'deleteCookie'], { userId: of('guest') });
        api = jasmine.createSpyObj<FavoriteApiService>(['getDocument']);

        await TestBed.configureTestingModule({
            providers: [],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(FavoriteComponent, {
            remove: { providers: [FavoriteApiService], imports: [SecuredImageComponent] },
            add: {
                providers: [{ provide: FavoriteApiService, useValue: api }],
                imports: [TestSecuredImageComponent],
            },
        });

        fixture = TestBed.createComponent(FavoriteComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
