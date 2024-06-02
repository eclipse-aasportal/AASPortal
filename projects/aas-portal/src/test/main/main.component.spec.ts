/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AASDocument } from 'common';
import { WindowService } from 'aas-lib';

import { MainComponent } from '../../app/main/main.component';
import { MainApiService } from '../../app/main/main-api.service';
import { ToolbarService } from '../../app/toolbar.service';
import { NgModule } from '@angular/core';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;
    let documentSubject: Subject<AASDocument | null>;
    let api: jasmine.SpyObj<MainApiService>;
    let window: jasmine.SpyObj<WindowService>;
    let toolbar: jasmine.SpyObj<ToolbarService>;

    beforeEach(() => {
        documentSubject = new Subject<AASDocument | null>();
        documentSubject.next(null);
        api = jasmine.createSpyObj<MainApiService>('ProjectService', ['getDocument']);
        window = jasmine.createSpyObj<WindowService>(['getQueryParams']);
        window.getQueryParams.and.returnValue(new URLSearchParams());
        toolbar = jasmine.createSpyObj<ToolbarService>(['set', 'clear']);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: MainApiService,
                    useValue: api,
                },
                {
                    provide: WindowService,
                    useValue: window,
                },
                {
                    provide: ToolbarService,
                    useValue: toolbar,
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

        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a list of route links', function () {
        expect(component.links).toBeDefined();
        expect(component.links.map(link => link.url)).toEqual(['/start', '/aas', '/view', '/dashboard', '/about']);
    });
});
