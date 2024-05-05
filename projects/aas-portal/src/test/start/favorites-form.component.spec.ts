/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { FavoritesFormComponent } from '../../app/start/favorites-form/favorites-form.component';
import { FavoritesService } from '../../app/start/favorites.service';

describe('FavoritesFormComponent', () => {
    let component: FavoritesFormComponent;
    let fixture: ComponentFixture<FavoritesFormComponent>;
    let service: jasmine.SpyObj<FavoritesService>;

    beforeEach(() => {
        service = jasmine.createSpyObj<FavoritesService>(['add', 'delete', 'get', 'has', 'remove'], { lists: [] });

        TestBed.configureTestingModule({
            declarations: [FavoritesFormComponent],
            providers: [
                NgbActiveModal,
                {
                    provide: FavoritesService,
                    useValue: service,
                },
            ],
            imports: [
                CommonModule,
                FormsModule,
                NgbModule,
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
