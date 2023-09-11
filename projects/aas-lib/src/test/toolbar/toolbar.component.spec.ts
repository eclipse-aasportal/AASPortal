/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, first } from 'rxjs';
import {
    Toolbar,
    ToolbarButton,
    ToolbarCheckbox,
    ToolbarColorPicker,
    ToolbarCommandCanExecute,
    ToolbarCommandExecute,
    ToolbarDropDown,
    ToolbarFileInput,
    ToolbarMenuItem,
    ToolbarOption,
    ToolbarRadio,
    ToolbarSelect,
    ToolbarSwitch,
    ToolbarTextInput
} from '../../lib/toolbar/toolbar';

import { ToolbarService } from '../../lib/toolbar/toolbar.service';
import { ToolbarComponent } from '../../lib/toolbar/toolbar.component';

describe('ToolbarComponent', () => {
    let component: ToolbarComponent;
    let service: ToolbarService;
    let fixture: ComponentFixture<ToolbarComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ToolbarComponent],
            providers: [],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })

            ]
        });

        fixture = TestBed.createComponent(ToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        service = TestBed.inject(ToolbarService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('toolbar button', function () {
        let toolbar: Toolbar;
        let button: ToolbarButton;
        let execute: jasmine.Spy<ToolbarCommandExecute>;
        let canExecute: jasmine.Spy<ToolbarCommandCanExecute>;

        beforeEach(function () {
            execute = jasmine.createSpy('execute');
            canExecute = jasmine.createSpy('canExecute').and.returnValue(true);
            button = service.createButton('bi bi-gear', execute, canExecute);
            toolbar = { groups: [service.createGroup([button])] };
            service.setToolbar(toolbar);
        });

        it('should provide a button', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const buttonElement: HTMLButtonElement = toolbarElement.querySelector('button')!;
                buttonElement.dispatchEvent(new Event('click'));
                expect(execute).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('radio button', function () {
        let toolbar: Toolbar;
        let radio1: ToolbarRadio;
        let radio2: ToolbarRadio;
        let checked1: BehaviorSubject<boolean>;
        let checked2: BehaviorSubject<boolean>;
        let execute1: ToolbarCommandExecute;
        let execute2: ToolbarCommandExecute;

        beforeEach(function () {
            checked1 = new BehaviorSubject<boolean>(true);
            checked2 = new BehaviorSubject<boolean>(false);

            execute1 = () => {
                const value = checked1.getValue();
                checked1.next(!value);
                checked2.next(value);
            };

            execute2 = () => () => {
                const value = checked2.getValue();
                checked2.next(!value);
                checked1.next(value);
            };;

            radio1 = service.createRadio('bi bi-1-circle', '1', checked1.asObservable(), execute1);
            radio2 = service.createRadio('bi bi-2-circle', '2', checked2.asObservable(), execute2);
            toolbar = { groups: [service.createGroup([radio1, radio2])] };
            service.setToolbar(toolbar);
        });

        it('should provide radio buttons', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const radio1Element: HTMLInputElement = toolbarElement.querySelector('#' + radio1.id)!;
                const radio2Element: HTMLInputElement = toolbarElement.querySelector('#' + radio2.id)!;
                expect(radio1Element.checked).toBeTrue();
                expect(radio2Element.checked).toBeFalse();

                radio2Element.checked = true;
                checked2.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(radio1Element.checked).toBeFalse();
                    expect(radio2Element.checked).toBeTrue();
                });

                radio1Element.checked = true;
                checked1.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(radio1Element.checked).toBeTrue();
                    expect(radio2Element.checked).toBeFalse();
                    done();
                });
            });
        });
    });

    describe('checkbox', function () {
        let toolbar: Toolbar;
        let checkbox: ToolbarCheckbox;
        let execute: ToolbarCommandExecute;
        let canExecute: jasmine.Spy<ToolbarCommandCanExecute>;
        let checked: BehaviorSubject<boolean>;

        beforeEach(function () {
            checked = new BehaviorSubject<boolean>(false);

            execute = () => {
                checked.next(!checked.getValue());
            };

            canExecute = jasmine.createSpy('canExecute').and.returnValue(true);
            checkbox = service.createCheckbox('bi bi-check', checked.asObservable(), execute, canExecute);
            toolbar = { groups: [service.createGroup([checkbox])] };
            service.setToolbar(toolbar);
        });

        it('should provide a checkbox', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const checkboxElement: HTMLInputElement = toolbarElement.querySelector('#' + checkbox.id)!;
                expect(checkboxElement.checked).toBeFalse();

                checkboxElement.checked = true;
                checked.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(checkboxElement.checked).toBeTrue();
                });

                checkboxElement.checked = false;
                checked.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(checkboxElement.checked).toBeFalse();
                    done();
                });
            });
        });
    });

    describe('switch', function () {
        let toolbar: Toolbar;
        let toolbarSwitch: ToolbarSwitch;
        let execute: ToolbarCommandExecute;
        let canExecute: jasmine.Spy<ToolbarCommandCanExecute>;
        let checked: BehaviorSubject<boolean>;

        beforeEach(function () {
            checked = new BehaviorSubject<boolean>(false);

            execute = () => {
                checked.next(!checked.getValue());
            };

            canExecute = jasmine.createSpy('canExecute').and.returnValue(true);
            toolbarSwitch = service.createSwitch('switch', checked.asObservable(), execute, canExecute);
            toolbar = { groups: [service.createGroup([toolbarSwitch])] };
            service.setToolbar(toolbar);
        });

        it('should provide a switch', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const switchElement: HTMLInputElement = toolbarElement.querySelector('#' + toolbarSwitch.id)!;
                expect(switchElement.checked).toBeFalse();

                switchElement.checked = true;
                checked.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(switchElement.checked).toBeTrue();
                });

                switchElement.checked = false;
                checked.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(switchElement.checked).toBeFalse();
                    done();
                });
            });
        });
    });

    describe('dropdown menu', function () {
        let toolbar: Toolbar;
        let dropdown: ToolbarDropDown;
        let menuItem: ToolbarMenuItem;
        let execute: jasmine.Spy<ToolbarCommandExecute>;

        beforeEach(function () {
            execute = jasmine.createSpy('execute');
            menuItem = service.createMenuItem('command', execute);
            dropdown = service.createDropDown('', [menuItem]);

            toolbar = { groups: [service.createGroup([dropdown])] };
            service.setToolbar(toolbar);
        });

        it('provides a dropdown menu', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const dropdownElement: HTMLDivElement = toolbarElement.querySelector('#' + dropdown.id)!;
                dropdownElement.dispatchEvent(new Event('click'));
                fixture.detectChanges();
                const menuItemElement: HTMLButtonElement = toolbarElement.querySelector('#' + menuItem.id)!
                menuItemElement.dispatchEvent(new Event('click'));
                expect(execute).toHaveBeenCalled();
                done();
            });
        });
    });

    describe('text input', function () {
        let toolbar: Toolbar;
        let textInput: ToolbarTextInput;
        let execute: ToolbarCommandExecute;
        let canExecute: jasmine.Spy<ToolbarCommandCanExecute>;
        let value: BehaviorSubject<string>;

        beforeEach(function () {
            value = new BehaviorSubject<string>('');

            execute = (argument: string) => {
                value.next(argument);
            };

            canExecute = jasmine.createSpy('canExecute').and.returnValue(true);
            textInput = service.createTextInput('bi bi-pen', '', 'text input', execute);
            toolbar = { groups: [service.createGroup([textInput])] };
            service.setToolbar(toolbar);
        });

        it('should provide a text input', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const inputElement: HTMLInputElement = toolbarElement.querySelector('#' + textInput.id)!;
                expect(inputElement.value).toEqual('');

                inputElement.value = 'Hello World!';
                inputElement.dispatchEvent(new Event('input'));
                value.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(inputElement.value).toEqual('Hello World!');
                    done();
                });
            });
        });
    });

    describe('color picker', function () {
        let toolbar: Toolbar;
        let colorPicker: ToolbarColorPicker;
        let execute: ToolbarCommandExecute;
        let color: BehaviorSubject<string>;

        beforeEach(function () {
            color = new BehaviorSubject<string>('#000000');

            execute = (argument: string) => {
                color.next(argument);
            };

            colorPicker = service.createColorPicker(color, execute);
            toolbar = { groups: [service.createGroup([colorPicker])] };
            service.setToolbar(toolbar);
        });

        it('should provide a color picker', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const colorElement: HTMLInputElement = toolbarElement.querySelector('#' + colorPicker.id)!;

                colorElement.value = '#123456';
                colorElement.dispatchEvent(new Event('change'));
                color.asObservable().pipe(first()).subscribe(() => {
                    fixture.detectChanges();
                    expect(colorElement.value).toEqual('#123456');
                    done();
                });
            });
        });
    });

    describe('file input', function () {
        let toolbar: Toolbar;
        let fileInput: ToolbarFileInput;
        let execute: ToolbarCommandExecute;
        let canExecute: jasmine.Spy<ToolbarCommandCanExecute>;

        beforeEach(function () {
            execute = (argument: FileList) => {
            };

            canExecute = jasmine.createSpy('canExecute').and.returnValue(true);
            fileInput = service.createFileInput('select file', execute);
            toolbar = { groups: [service.createGroup([fileInput])] };
            service.setToolbar(toolbar);
        });

        it('should provide a file select', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const inputElement: HTMLInputElement = toolbarElement.querySelector('#' + fileInput.id)!;
                const buttonElement: HTMLButtonElement = toolbarElement.querySelector('#' + fileInput.id + 'Addon')!;
                expect(inputElement).toBeTruthy();
                expect(buttonElement).toBeTruthy();
                done();
            });
        });
    });

    describe('select', function () {
        let toolbar: Toolbar;
        let select: ToolbarSelect;
        let option1: ToolbarOption;
        let option2: ToolbarOption;
        let execute: ToolbarCommandExecute;
        let value: BehaviorSubject<string>;

        beforeEach(function () {
            value = new BehaviorSubject<string>('1');
            execute = (argument: string) => {
                value.next(argument);
            };

            option1 = service.createOption('1', '1');
            option2 = service.createOption('2', '2');
            select = service.createSelect([option1, option2], value.asObservable(), execute);
            toolbar = { groups: [service.createGroup([select])] };
            service.setToolbar(toolbar);
        });

        it('provides a select', function (done: DoneFn) {
            service.groups.pipe(first()).subscribe(() => {
                fixture.detectChanges();
                const toolbarElement: HTMLElement = fixture.debugElement.nativeElement;
                const selectElement: HTMLSelectElement = toolbarElement.querySelector('#' + select.id)!;
                expect(selectElement.value).toEqual(option1.value);

                selectElement.value = option2.value;
                selectElement.dispatchEvent(new Event('change'));
            });

            value.asObservable().pipe(first()).subscribe(() => {
                fixture.detectChanges();
                expect(value.getValue()).toEqual(option2.value);
                done();
            });
        });
    });
});