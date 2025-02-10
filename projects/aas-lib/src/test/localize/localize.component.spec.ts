/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { LocalizeComponent } from '../../lib/localize/localize.component';
import { WINDOW } from '../../public-api';

describe('LocalizeComponent', () => {
    let component: LocalizeComponent;
    let fixture: ComponentFixture<LocalizeComponent>;
    let window: jasmine.SpyObj<Window>;
    let localStorage: jasmine.SpyObj<Storage>;

    beforeEach(() => {

        localStorage = jasmine.createSpyObj<Storage>([
            'getItem',
            'setItem',
            'removeItem',
            'clear',
        ]);

        localStorage.getItem.and.returnValue(null);
        window = jasmine.createSpyObj<Window>(['confirm'], { localStorage })

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: WINDOW,
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
        fixture.componentRef.setInput('languages', ['en-us', 'de-de']);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a list of supported languages', () => {
        localStorage.getItem.and.returnValue(null);
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
