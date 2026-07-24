/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Component, input, provideZonelessChangeDetection, Signal, signal } from '@angular/core';

import { AASDocument } from 'aas-core';
import {
    AuthComponent,
    IndexChange,
    LocalizeComponent,
    NotifyComponent,
    SettingsComponent,
    ToolbarService,
} from 'aas-lib';

import { MainComponent } from './main.component';
import { createSpyObj, FakeLoader } from '../../test/mocks';

@Component({
    selector: 'fhg-auth',
    template: '<div></div>',
    standalone: true,
})
class TestAuthComponent {}

@Component({
    selector: 'fhg-settings',
    template: '<div></div>',
    standalone: true,
})
class TestSettingsComponent {}

@Component({
    selector: 'fhg-localize',
    template: '<div></div>',
    standalone: true,
})
class TestLocalizeComponent {
    public readonly languages = input(['en-us']);
}

@Component({
    selector: 'fhg-notify',
    template: '<div></div>',
    standalone: true,
})
class TestNotifyComponent {}

describe('MainComponent', () => {
    let documentSubject: Subject<AASDocument | null>;
    let toolbar: Mocked<ToolbarService>;
    let indexChange: Mocked<IndexChange>;

    beforeEach(async () => {
        documentSubject = new Subject<AASDocument | null>();
        documentSubject.next(null);
        toolbar = createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) });
        indexChange = createSpyObj<IndexChange>(['reload'], {
            documentCount: (() => 42) as Signal<number>,
            endpointCount: (() => 1) as Signal<number>,
            changedDocuments: (() => 0) as Signal<number>,
        });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: toolbar,
                },
                {
                    provide: IndexChange,
                    useValue: indexChange,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideRouter([]),
                provideZonelessChangeDetection(),
            ],
            imports: [MainComponent],
        }).compileComponents();

        TestBed.overrideComponent(MainComponent, {
            remove: {
                imports: [NotifyComponent, LocalizeComponent, AuthComponent, SettingsComponent],
            },
            add: {
                imports: [TestNotifyComponent, TestLocalizeComponent, TestAuthComponent, TestSettingsComponent],
            },
        });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(MainComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('provides a list of route links', function () {
        const fixture = TestBed.createComponent(MainComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.links()).toBeDefined();
        expect(component.links().map(link => link.url)).toEqual([
            '/start',
            '/shells',
            '/aas',
            '/views',
            '/dashboard',
            '/about',
        ]);
    });
});
