/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressComponent } from '../../../lib/components/progress/progress.component';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ProgressComponent', () => {
    let component: ProgressComponent;
    let fixture: ComponentFixture<ProgressComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProgressComponent],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(ProgressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});