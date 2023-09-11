/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
    Toolbar,
    ToolbarCommandCanExecute,
    ToolbarCommandExecute as ToolbarCommandExecute,
    ToolbarDivider,
    ToolbarItem,
    ToolbarButton,
    ToolbarMenuItem,
    ToolbarDropDown,
    ToolbarItemGroup,
    ToolbarItemType,
    ToolbarItemStyle,
    ToolbarRadio,
    ToolbarTextInput,
    ToolbarSwitch,
    ToolbarFileInput,
    ToolbarColorPicker,
    ToolbarCheckbox,
    ToolbarSelect,
    ToolbarOption,
    ToolbarCheckedItem
} from './toolbar';

@Injectable({
    providedIn: 'root'
})
export class ToolbarService {
    private readonly toolbarGroups = new BehaviorSubject<ToolbarItemGroup[]>([]);
    private subscription = new Subscription();
    private ready = false;
    private nextId = 1;

    constructor() {
        this.groups = this.toolbarGroups.asObservable();
    }

    public groups: Observable<ToolbarItemGroup[]>;

    public setToolbar(toolbar?: Toolbar | null): void {
        if (toolbar != null) {
            const inputTextGroups = toolbar.groups.filter(g => g.items.some(item => item.type === ToolbarItemType.TextInput));
            if (inputTextGroups.length === 1) {
                inputTextGroups[0].fill = true;
            }

            this.ready = true;
            this.toolbarGroups.next(toolbar.groups);
        }
        else {
            this.toolbarGroups.next([]);
            this.nextId = 1;
            this.subscription.unsubscribe();
            this.subscription = new Subscription();
            this.ready = false;
        }
    }

    public createGroup(items: ToolbarItem[], visible?: boolean | Observable<boolean>): ToolbarItemGroup {
        const group: ToolbarItemGroup = {
            id: this.createId(),
            visible: typeof visible === 'boolean' ? visible : true,
            fill: false,
            items: items
        }

        if (visible instanceof Observable) {
            this.subscription.add(visible.subscribe(
                value => this.ready ? this.updateGroupVisible(group.id, value) : group.visible = value));
        }

        return group;
    }

    public createButton(classname: string,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarButton {
        const item: ToolbarButton = {
            id: this.createId(),
            type: ToolbarItemType.Button,
            style: ToolbarItemStyle.Icon,
            classname: classname,
            command: { execute: execute, canExecute: canExecute ?? (() => true) }
        };

        return item;
    }

    public createRadio(
        classname: string,
        value: string | boolean | number,
        checked: boolean | Observable<boolean>,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarRadio {
        const radio: ToolbarRadio = {
            id: this.createId(),
            type: ToolbarItemType.Radio,
            style: ToolbarItemStyle.Icon,
            classname: classname,
            value: value,
            checked: typeof checked === 'boolean' ? checked : false,
            command: {
                execute: execute,
                canExecute: canExecute ?? (() => true)
            }
        };

        if (checked instanceof Observable) {
            this.subscription.add(checked.subscribe(
                state => this.ready ? this.updateChecked(radio.id, state) : radio.checked = state));
        }

        return radio;
    }

    public createCheckbox(
        classname: string,
        checked: boolean | Observable<boolean>,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarCheckbox {
        const checkbox: ToolbarCheckbox = {
            id: this.createId(),
            type: ToolbarItemType.Checkbox,
            style: ToolbarItemStyle.Icon,
            classname: classname,
            checked: typeof checked === 'boolean' ? checked : false,
            command: {
                execute: execute,
                canExecute: canExecute ?? (() => true)
            }
        };

        if (checked instanceof Observable) {
            this.subscription.add(checked.subscribe(
                value => this.ready ? this.updateChecked(checkbox.id, value) : checkbox.checked = value));
        }

        return checkbox;
    }

    public createSwitch(
        name: string,
        checked: boolean | Observable<boolean>,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarSwitch {
        const item: ToolbarSwitch = {
            id: this.createId(),
            type: ToolbarItemType.Switch,
            style: ToolbarItemStyle.Icon,
            name: name,
            checked: typeof checked === 'boolean' ? checked : false,
            command: {
                execute: execute,
                canExecute: canExecute ?? (() => true)
            }
        };

        if (checked instanceof Observable) {
            this.subscription.add(checked.subscribe(
                value => this.ready ? this.updateChecked(item.id, value) : item.checked = value));
        }

        return item;
    }

    public createTextInput(classname: string, value: string | Observable<string>, placeholder: string, execute: ToolbarCommandExecute): ToolbarTextInput {
        const textInput: ToolbarTextInput = {
            id: this.createId(),
            type: ToolbarItemType.TextInput,
            style: ToolbarItemStyle.Icon,
            classname: classname,
            value: typeof value === 'string' ? value : '',
            placeholder: placeholder,
            command: { execute: execute, canExecute: () => true }
        };

        if (value instanceof Observable) {
            this.subscription.add(
                value.subscribe(text => this.ready ? this.updateInputValue(textInput.id, text) : textInput.value = text));
        }

        return textInput;
    }

    public createFileInput(name: string, execute: ToolbarCommandExecute): ToolbarFileInput {
        const fileInput: ToolbarFileInput = {
            id: this.createId(),
            type: ToolbarItemType.FileInput,
            style: ToolbarItemStyle.Icon,
            name: name,
            command: { execute: execute, canExecute: () => true }
        };

        return fileInput;
    }

    public createDivider(): ToolbarItem {
        return ({
            id: this.createId(),
            type: ToolbarItemType.Divider,
            style: ToolbarItemStyle.Text,
        } as ToolbarDivider) as ToolbarItem;
    }

    public createColorPicker(
        value: string | Observable<string>,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarColorPicker {
        const item: ToolbarColorPicker = {
            id: this.createId(),
            value: typeof value === 'string' ? value : '',
            type: ToolbarItemType.ColorPicker,
            style: ToolbarItemStyle.Icon,
            command: { execute: execute, canExecute: canExecute ?? (() => true) }
        };

        if (value instanceof Observable) {
            this.subscription.add(value.subscribe(
                color => this.ready ? this.updateColorPickerValue(item.id, color) : item.value = color));
        }

        return item;
    }

    public createDropDown(
        classname: string,
        items: ToolbarItem[] | Observable<ToolbarItem[]>,
        name?: string | Observable<string>,
        enabled?: boolean | Observable<boolean>): ToolbarDropDown {
        const dropDown: ToolbarDropDown = {
            id: this.createId(),
            type: ToolbarItemType.Dropdown,
            style: name ? ToolbarItemStyle.IconText : ToolbarItemStyle.Icon,
            classname: classname,
            name: typeof name === 'string' ? name : '',
            items: Array.isArray(items) ? items : [],
            enabled: typeof enabled === 'boolean' ? enabled : true
        };

        if (name instanceof Observable) {
            this.subscription.add(name.subscribe(
                value => this.ready ? this.updateDropDownName(dropDown.id, value) : dropDown.name = value));
        }

        if (items instanceof Observable) {
            this.subscription.add(items.subscribe(
                value => this.ready ? this.updateDropDownItems(dropDown.id, value) : dropDown.items = value));
        }

        if (enabled instanceof Observable) {
            this.subscription.add(enabled.subscribe(
                value => this.ready ? this.updateDropDownEnabled(dropDown.id, value) : dropDown.enabled = value));
        }

        return dropDown;
    }

    public createMenuItem(
        name: string,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarMenuItem {
        const menuItem: ToolbarMenuItem = {
            id: this.createId(),
            type: ToolbarItemType.MenuItem,
            style: ToolbarItemStyle.Text,
            name: name,
            command: {
                execute: execute,
                canExecute: canExecute ?? (() => true)
            }
        };

        return menuItem;
    }

    public createSelect<T>(
        options: ToolbarOption[] | Observable<ToolbarOption[]>,
        value: Observable<T>,
        execute: ToolbarCommandExecute,
        canExecute?: ToolbarCommandCanExecute): ToolbarSelect {
        const select: ToolbarSelect = {
            id: this.createId(),
            value: null,
            type: ToolbarItemType.Select,
            style: ToolbarItemStyle.Text,
            options: Array.isArray(options) ? options : [],
            command: { execute: execute, canExecute: canExecute ?? (() => true) }
        };

        if (value instanceof Observable) {
            this.subscription.add(value.subscribe(v => this.ready ? this.updateSelectValue(select.id, v) : select.value = v))
        }

        if (options instanceof Observable) {
            this.subscription.add(options.subscribe(
                items => this.ready ? this.updateSelectOptions(select.id, items) : select.options = items));
        }

        return select;
    }

    public createOption<T>(name: string, value: T): ToolbarOption {
        const option: ToolbarOption = {
            id: this.createId(),
            name: name,
            value: value
        };

        return option;
    }

    private updateGroupVisible(id: string, visible: boolean): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        const index = toolbarGroups.findIndex(item => item.id === id);
        if (index >= 0) {
            const group = toolbarGroups[index];
            toolbarGroups[index] = { ...group, visible };
            this.toolbarGroups.next(toolbarGroups);
        }
    }

    private updateChecked(id: string, checked: boolean): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const checkedItem = items[j] as ToolbarCheckedItem;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...checkedItem, checked } as ToolbarCheckedItem;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateColorPickerValue(id: string, value: string): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const colorPicker = items[j] as ToolbarColorPicker;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...colorPicker, value } as ToolbarColorPicker;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateDropDownName(id: string, name: string): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const dropDown = items[j] as ToolbarDropDown;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...dropDown, name } as ToolbarDropDown;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateDropDownItems(id: string, items: ToolbarItem[]): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const groupItems = group.items;
            for (let j = 0; j < groupItems.length; j++) {
                if (groupItems[j].id === id) {
                    const dropDown = groupItems[j] as ToolbarDropDown;
                    toolbarGroups[i] = { ...group, items: [...groupItems] };
                    toolbarGroups[i].items[j] = { ...dropDown, items } as ToolbarDropDown;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateDropDownEnabled(id: string, enabled: boolean): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const dropDown = items[j] as ToolbarDropDown;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...dropDown, enabled } as ToolbarDropDown;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateSelectOptions(id: string, options: ToolbarOption[]): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const select = items[j] as ToolbarSelect;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...select, options } as ToolbarSelect;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateSelectValue(id: string, value: any): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const select = items[j] as ToolbarSelect;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...select, value } as ToolbarSelect;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private updateInputValue(id: string, value: string): void {
        const toolbarGroups = [...this.toolbarGroups.getValue()];
        for (let i = 0; i < toolbarGroups.length; i++) {
            const group = toolbarGroups[i];
            const items = group.items;
            for (let j = 0; j < items.length; j++) {
                if (items[j].id === id) {
                    const textInput = items[j] as ToolbarTextInput;
                    toolbarGroups[i] = { ...group, items: [...items] };
                    toolbarGroups[i].items[j] = { ...textInput, value } as ToolbarTextInput;
                    this.toolbarGroups.next(toolbarGroups);
                    return;
                }
            }
        }
    }

    private createId(): string {
        return 'fhg-ti-' + this.nextId++;
    }
}