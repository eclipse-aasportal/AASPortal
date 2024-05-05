/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';
import { CommonModule } from '@angular/common';

describe('SecuredImageComponent', () => {
    let component: SecuredImageComponent;
    let fixture: ComponentFixture<SecuredImageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [SecuredImageComponent],
            imports: [CommonModule, HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(SecuredImageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
