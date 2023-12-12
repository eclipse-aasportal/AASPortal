/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesFormComponent } from '../../app/start/favorites-form/favorites-form.component';

describe('FavoritesFormComponent', () => {
    let component: FavoritesFormComponent;
    let fixture: ComponentFixture<FavoritesFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [FavoritesFormComponent]
        });

        fixture = TestBed.createComponent(FavoritesFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});