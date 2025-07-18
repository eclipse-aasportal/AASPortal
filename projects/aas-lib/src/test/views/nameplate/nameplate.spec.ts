/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nameplate } from '../../../lib/views/nameplate/nameplate';
import { provideZonelessChangeDetection } from '@angular/core';

xdescribe('Nameplate', () => {
    let component: Nameplate;
    let fixture: ComponentFixture<Nameplate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Nameplate],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(Nameplate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
