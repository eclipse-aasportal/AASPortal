/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DigitalNameplateCardComponent } from '../../lib/digital-nameplate/digital-nameplate-card.component';

describe('DigitalNameplateCardComponent', () => {
    let component: DigitalNameplateCardComponent;
    let fixture: ComponentFixture<DigitalNameplateCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
        }).compileComponents();

        fixture = TestBed.createComponent(DigitalNameplateCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
