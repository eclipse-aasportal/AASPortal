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

import { LocalizeComponent } from '../../lib/localize/localize.component';
import { WindowService } from '../../lib/window.service';

describe('LocalizeComponent', () => {
    let component: LocalizeComponent;
    let fixture: ComponentFixture<LocalizeComponent>;
    let window: jasmine.SpyObj<WindowService>;

    beforeEach(() => {
        window = jasmine.createSpyObj<WindowService>(['getLocalStorageItem', 'setLocalStorageItem']);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: WindowService,
                    useValue: window,
                },
            ],
            imports: [
                TranslateModule.forRoot({
                    defaultLanguage: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
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

    it('provides a list of supported languages', () => {
        window.getLocalStorageItem.and.returnValue(null);
        expect(component.cultures().map(item => item.localeId)).toEqual(['en-us', 'de-de']);
    });

    it('returns the current language', () => {
        expect(component.culture()?.localeId).toEqual('en-us');
    });

    it('allows setting a new current language', () => {
        component.setCulture(component.cultures().find(item => item.localeId === 'de-de')!);
        expect(component.culture()?.localeId).toEqual('de-de');
    });
});
