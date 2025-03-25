/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, Signal, signal } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AASDocument } from 'aas-core';
import {
    AuthComponent,
    IndexChangeService,
    LocalizeComponent,
    NotifyComponent,
} from 'aas-lib';

import { MainComponent } from '../../app/main/main.component';
import { ToolbarService } from '../../../../aas-lib/src/lib/toolbar.service';

@Component({
    selector: 'fhg-auth',
    template: '<div></div>',
    standalone: true,
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
})
class TestNotifyComponent {}

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;
    let documentSubject: Subject<AASDocument | null>;
    let toolbar: jasmine.SpyObj<ToolbarService>;
    let indexChange: jasmine.SpyObj<IndexChangeService>;

    beforeEach(() => {
        documentSubject = new Subject<AASDocument | null>();
        documentSubject.next(null);
        toolbar = jasmine.createSpyObj<ToolbarService>(['set', 'clear'], { toolbarTemplate: signal(null) });
        indexChange = jasmine.createSpyObj<IndexChangeService>(['clear'], {
            documentCount: (() => 42) as Signal<number>,
            endpointCount: (() => 1) as Signal<number>,
            changedDocuments: (() => 0) as Signal<number>,
        });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: toolbar,
                },
                {
                    provide: IndexChangeService,
                    useValue: indexChange,
                },
                provideRouter([]),
            ],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        TestBed.overrideComponent(MainComponent, {
            remove: {
                imports: [NotifyComponent, LocalizeComponent, AuthComponent],
            },
            add: {
                imports: [TestNotifyComponent, TestLocalizeComponent, TestAuthComponent],
            },
        });

        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a list of route links', function () {
        expect(component.links()).toBeDefined();
        expect(component.links().map(link => link.url)).toEqual(['/start', '/shells', '/aas', '/view', '/dashboard', '/about']);
    });
});