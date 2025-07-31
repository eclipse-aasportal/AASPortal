/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactInformationsView } from '../../../lib/views/contact-informations/contact-informations.view';

xdescribe('ContactInformationsView', () => {
    let component: ContactInformationsView;
    let fixture: ComponentFixture<ContactInformationsView>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContactInformationsView],
        }).compileComponents();

        fixture = TestBed.createComponent(ContactInformationsView);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});