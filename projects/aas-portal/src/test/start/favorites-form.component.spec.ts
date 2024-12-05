/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { FavoritesFormComponent } from '../../app/start/favorites-form/favorites-form.component';
import { FavoritesList, FavoritesService } from '../../app/start/favorites.service';

describe('FavoritesFormComponent', () => {
    let component: FavoritesFormComponent;
    let fixture: ComponentFixture<FavoritesFormComponent>;
    let service: jasmine.SpyObj<FavoritesService>;

    beforeEach(() => {
        service = jasmine.createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove', 'save'], {
            lists: signal<FavoritesList[]>([]),
        });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: jasmine.createSpyObj<NgbActiveModal>(['close', 'dismiss']),
                },
                {
                    provide: FavoritesService,
                    useValue: service,
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

        fixture = TestBed.createComponent(FavoritesFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
