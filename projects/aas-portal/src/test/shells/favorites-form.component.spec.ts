/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { FavoritesFormComponent } from '../../app/shells/favorites-form/favorites-form.component';
import { FavoritesList, FavoritesService } from '../../app/shells/favorites.service';
import { createSpyObj, FakeLoader } from '../mocks';

describe('FavoritesFormComponent', () => {
    let service: Mocked<FavoritesService>;

    beforeEach(async () => {
        service = createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove', 'save'], {
            active: signal(''),
            items: signal<FavoritesList[]>([]),
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: createSpyObj<NgbActiveModal>(['close', 'dismiss']),
                },
                {
                    provide: FavoritesService,
                    useValue: service,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [FavoritesFormComponent],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(FavoritesFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
