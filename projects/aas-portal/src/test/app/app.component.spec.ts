/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { AppComponent } from '../../app/app.component';
import { Component } from '@angular/core';
import { MainComponent } from '../../app/main/main.component';

@Component({
    selector: 'fhg-main',
    template: '<p></p>',
    styleUrls: [],
    standalone: true,
})
class TestMainComponent {}

describe('AppComponent', () => {
    beforeEach(() => {
        TestBed.overrideComponent(AppComponent, {
            remove: {
                imports: [MainComponent],
            },
            add: {
                imports: [TestMainComponent],
            },
        });
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });
});