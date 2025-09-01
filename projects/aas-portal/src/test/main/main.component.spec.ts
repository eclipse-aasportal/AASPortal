/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    provideZonelessChangeDetection,
    Signal,
    signal,
} from '@angular/core';

import { AASDocument } from 'aas-core';
import { AuthComponent, IndexChangeService, LocalizeComponent, NotifyComponent, ToolbarService } from 'aas-lib';

import { MainComponent } from '../../app/main/main.component';
import { createSpyObj, FakeLoader } from '../mocks';

@Component({
    selector: 'fhg-auth',
    template: '<div></div>',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestAuthComponent {}

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
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestNotifyComponent {}

describe('MainComponent', () => {
    let documentSubject: Subject<AASDocument | null>;
    let toolbar: jest.Mocked<ToolbarService>;
    let indexChange: jest.Mocked<IndexChangeService>;

    beforeEach(async () => {
        documentSubject = new Subject<AASDocument | null>();
        documentSubject.next(null);
        toolbar = createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) });
        indexChange = createSpyObj<IndexChangeService>(['clear'], {
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
                    provide: IndexChangeService,
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
            imports: [],
        }).compileComponents();

        TestBed.overrideComponent(MainComponent, {
            remove: {
                imports: [NotifyComponent, LocalizeComponent, AuthComponent],
            },
            add: {
                imports: [TestNotifyComponent, TestLocalizeComponent, TestAuthComponent],
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
