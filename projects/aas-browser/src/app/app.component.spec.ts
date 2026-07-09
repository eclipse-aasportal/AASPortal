/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'fhg-main',
    template: '<div></div>',
    styleUrls: [],
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestMainComponent {}

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        TestBed.overrideComponent(AppComponent, {
            remove: { imports: [MainComponent] },
            add: { imports: [TestMainComponent] },
        });
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
