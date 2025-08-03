/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactInformations } from '../../../lib/internal';

xdescribe('ContactInformations', () => {
    let component: ContactInformations;
    let fixture: ComponentFixture<ContactInformations>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactInformations],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactInformations);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});