/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandoverDocumentation } from '../../../lib/views/handover-documentation/handover-documentation';

xdescribe('HandoverDocumentation', () => {
    let component: HandoverDocumentation;
    let fixture: ComponentFixture<HandoverDocumentation>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HandoverDocumentation],
        }).compileComponents();

        fixture = TestBed.createComponent(HandoverDocumentation);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});