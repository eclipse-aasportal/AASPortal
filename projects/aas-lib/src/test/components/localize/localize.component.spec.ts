/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';

import { LocalizeComponent } from '../../../lib/components/localize/localize.component';
import { WINDOW, WindowService } from '../../../lib/services/window.service';

describe('LocalizeComponent', () => {
    let window: jasmine.SpyObj<Window>;
    let localStorage: jasmine.SpyObj<Storage>;

    beforeEach(async () => {
        localStorage = jasmine.createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);
        localStorage.getItem.and.returnValue(null);
        window = jasmine.createSpyObj<WindowService>(['confirm'], { localStorage });

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                LocalizeComponent,
                TranslateModule.forRoot({
                    defaultLanguage: 'en-us',
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(LocalizeComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('languages', ['en-us', 'de-de']);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('provides a list of supported languages', () => {
        const fixture = TestBed.createComponent(LocalizeComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('languages', ['en-us', 'de-de']);
        fixture.detectChanges();
        localStorage.getItem.and.returnValue(null);
        expect(component.cultures().map(item => item.localeId)).toEqual(['en-us', 'de-de']);
    });

    it('returns the current language', () => {
        const fixture = TestBed.createComponent(LocalizeComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('languages', ['en-us', 'de-de']);
        fixture.detectChanges();
        expect(component.culture()?.localeId).toEqual('en-us');
    });

    it('allows setting a new current language', () => {
        const fixture = TestBed.createComponent(LocalizeComponent);
        const component = fixture.componentInstance;
        fixture.componentRef.setInput('languages', ['en-us', 'de-de']);
        fixture.detectChanges();
        component.setCulture(component.cultures().find(item => item.localeId === 'de-de')!);
        expect(component.culture()?.localeId).toEqual('de-de');
    });
});
