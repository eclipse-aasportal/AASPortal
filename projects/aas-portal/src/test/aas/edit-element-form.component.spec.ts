/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { aas } from 'aas-core';
import { EditElementFormComponent } from '../../app/aas/edit-element-form/edit-element-form.component';

describe('EditElementFormComponent', () => {
    let component: EditElementFormComponent;
    let fixture: ComponentFixture<EditElementFormComponent>;
    let activeModal: jasmine.SpyObj<NgbActiveModal>;

    beforeEach(() => {
        activeModal = jasmine.createSpyObj('NgbActiveModal', ['close']);
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: activeModal,
                },
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

        fixture = TestBed.createComponent(EditElementFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Property', () => {
        let property: aas.Property;

        beforeEach(() => {
            property = {
                idShort: 'Text',
                modelType: 'Property',
                category: 'CONSTANT',
                valueType: 'xs:string',
            };

            component.initialize(property);
            fixture.detectChanges();
        });

        it('allows editing a string Property', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                expect((result as aas.Property).value).toEqual('Hello World!');
                done();
            });

            const element: HTMLElement = fixture.debugElement.nativeElement;
            const inputElement: HTMLInputElement = element.querySelector('#inputValue')!;

            inputElement.value = 'Hello World!';
            inputElement.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            component.value.set(inputElement.value);
            component.submit();
        });

        it('allows changing the category to PARAMETER', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                expect((result as aas.Property).category).toEqual('PARAMETER');
                done();
            });

            const element: HTMLElement = fixture.debugElement.nativeElement;
            const selectElement: HTMLSelectElement = element.querySelector('#selectCategory')!;
            selectElement.options[component.categories().indexOf('PARAMETER')].defaultSelected = true;
            selectElement.dispatchEvent(new Event('change'));
            fixture.detectChanges();

            // hack
            component.category.set(selectElement.options[selectElement.selectedIndex].label);
            component.submit();
        });

        it('allows changing the value type to "double"', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                expect((result as aas.Property).valueType).toEqual('xs:double');
                done();
            });

            const element: HTMLElement = fixture.debugElement.nativeElement;
            const selectElement: HTMLSelectElement = element.querySelector('#selectValueType')!;
            selectElement.options[component.valueTypes().indexOf('xs:double')].defaultSelected = true;
            selectElement.dispatchEvent(new Event('change'));
            fixture.detectChanges();

            // hack
            component.valueType.set(selectElement.options[selectElement.selectedIndex].label as aas.DataTypeDefXsd);
            component.submit();
        });
    });

    describe('MultiLanguageProperty', () => {
        let property: aas.MultiLanguageProperty;

        beforeEach(() => {
            property = {
                idShort: 'A multi language property',
                modelType: 'MultiLanguageProperty',
                category: 'CONSTANT',
                value: [{ language: 'de', text: 'Hallo Welt!' }],
            };

            component.initialize(property);
            fixture.detectChanges();
        });

        it('allows editing an existing locale text', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                const expected: aas.LangString[] = [{ language: 'de', text: 'Hallo Mond!' }];
                expect((result as aas.MultiLanguageProperty).value).toEqual(expected);
                done();
            });

            component.setText(component.langStrings()[0], 'Hallo Mond!');
            component.submit();
        });

        it('allows removing an existing locale text', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                const expected: aas.LangString[] = [];
                expect((result as aas.MultiLanguageProperty).value).toEqual(expected);
                done();
            });

            component.removeLangString(component.langStrings()[0]);
            component.submit();
        });

        it('allows adding a new locale text', (done: DoneFn) => {
            activeModal.close.and.callFake(result => {
                const expected: aas.LangString[] = [
                    { language: 'de', text: 'Hallo Welt!' },
                    { language: 'en', text: 'Hello World!' },
                ];

                expect((result as aas.MultiLanguageProperty).value).toEqual(expected);
                done();
            });

            const langString = component.langStrings()[component.langStrings().length - 1];
            component.addLangString();
            component.setLanguage(langString, 'en');
            component.setText(langString, 'Hello World!');
            component.submit();
        });
    });
});