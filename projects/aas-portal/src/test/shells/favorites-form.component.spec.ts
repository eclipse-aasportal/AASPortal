/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { FavoritesFormComponent } from '../../app/shells/favorites-form/favorites-form.component';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';

describe('FavoritesFormComponent', () => {
    let service: jasmine.SpyObj<FavoritesService>;

    beforeEach(async () => {
        service = jasmine.createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove', 'save'], {
            active: signal(''),
            items: signal<FavoritesList[]>([]),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: jasmine.createSpyObj<NgbActiveModal>(['close', 'dismiss']),
                },
                {
                    provide: FavoritesService,
                    useValue: service,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                FavoritesFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FavoritesFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});