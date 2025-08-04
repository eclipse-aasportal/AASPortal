/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactInformations } from '../../../lib/views/contact-informations/contact-informations';
import { provideZonelessChangeDetection } from '@angular/core';

xdescribe('ContactInformations', () => {
    let component: ContactInformations;
    let fixture: ComponentFixture<ContactInformations>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
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