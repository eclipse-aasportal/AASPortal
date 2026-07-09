/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Endpoints } from './endpoints';
import { provideZonelessChangeDetection } from '@angular/core';

describe('Endpoints', () => {
    let component: Endpoints;
    let fixture: ComponentFixture<Endpoints>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Endpoints],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(Endpoints);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
