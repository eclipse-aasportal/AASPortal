/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { first } from 'rxjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

import { CultureInfo } from '../../lib/localize/culture-info';
import { LocalizeComponent } from '../../lib/localize/localize.component';
import { WindowService } from '../../lib/window.service';

describe('LocalizeComponent', () => {
    let component: LocalizeComponent;
    let fixture: ComponentFixture<LocalizeComponent>;
    let window: jasmine.SpyObj<WindowService>;

    beforeEach(() => {
        window = jasmine.createSpyObj<WindowService>(['getLocalStorageItem', 'setLocalStorageItem']);

        TestBed.configureTestingModule({
            declarations: [LocalizeComponent],
            providers: [
                {
                    provide: WindowService,
                    useValue: window
                }
            ],
            imports: [
                CommonModule,
                NgbModule,
                TranslateModule.forRoot({
                    defaultLanguage: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(LocalizeComponent);
        component = fixture.componentInstance;
        component.languages = ['en-us', 'de-de'];
        component.ngOnChanges({ languages: new SimpleChange(undefined, component.languages, true) });
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a list of supported languages', function (done: DoneFn) {
        window.getLocalStorageItem.and.returnValue(null);
        component.cultures.pipe(first()).subscribe(value => {
            expect(value.map(item => item.localeId)).toEqual(['en-us', 'de-de']);
            done();
        });
    });

    it('returns the current language', function (done: DoneFn) {
        component.culture.pipe(first()).subscribe(value => {
            expect(value?.localeId).toEqual('en-us');
            done();
        });
    });

    it('allows setting a new current language', function (done: DoneFn) {
        component.cultures.pipe(first()).subscribe(value => {
            component.setCulture(value.find(item => item.localeId === 'de-de') as CultureInfo);
            component.culture.pipe(first()).subscribe(value => {
                expect(value?.localeId).toEqual('de-de');
                done();
            })
        });
    });
});