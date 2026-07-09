/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { DataSheet } from './data-sheet';
import { DataSheetData } from '../../types';

describe('DataSheet', () => {
    let component: DataSheet;
    let fixture: ComponentFixture<DataSheet>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataSheet],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(DataSheet);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('dataSheet', {
            name: 'Caption',
            collapsed: false,
            items: [
                {
                    idShort: 'string',
                    displayName: 'String',
                    value: 'Hello World.',
                },
                {
                    idShort: 'stringArray',
                    displayName: 'String array',
                    value: ['Hello', 'World.'],
                },
            ],
        } satisfies DataSheetData);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('has items', () => {
        expect(component.items()).toBeDefined();
        expect(component.items().length).toBe(2);
    });
});
