/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from '../../app/app.component';
import { MainComponent } from '../../app/main/main.component';

@Component({
    selector: 'fhg-main',
    template: '<p></p>',
    styleUrls: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestMainComponent {}

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
            imports: [AppComponent],
        }).compileComponents();

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
