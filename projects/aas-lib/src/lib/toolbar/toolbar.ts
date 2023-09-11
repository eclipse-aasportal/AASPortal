/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Observable } from "rxjs";

export type ToolbarCommandExecute = (argument?: any) => void;
export type ToolbarCommandCanExecute = (argument?: any) => boolean;

export interface ToolbarCommand {
    execute(argument?: any): void;
    canExecute(argument?: any): boolean;
}

export enum ToolbarItemType {
    Button = 'Button',
    TextInput = 'TextInput',
    FileInput = 'FileInput',
    Radio = 'Radio',
    Switch = 'Switch',
    Dropdown = 'Dropdown',
    MenuItem = 'MenuItem',
    Divider = 'Divider',
    ColorPicker = 'ColorPicker',
    Select = 'Select',
    Checkbox = "Checkbox"
}

export enum ToolbarItemStyle {
    Text = 'Text',
    Icon = 'Icon',
    IconText = 'IconText'
}

export interface ToolbarObject {
    id: string;
}

export interface ToolbarItem extends ToolbarObject {
    type: ToolbarItemType;
    style: ToolbarItemStyle;
    name?: string;
    classname?: string;
    enabled?: boolean;
}

export interface ToolbarCommandItem extends ToolbarItem {
    command: ToolbarCommand;
}

export interface ToolbarButton extends ToolbarCommandItem {
    type: ToolbarItemType.Button;
}

export interface ToolbarColorPicker extends ToolbarCommandItem {
    type: ToolbarItemType.ColorPicker;
    value: string;
}

export interface ToolbarCheckedItem extends ToolbarCommandItem {
    checked: boolean;
}

export interface ToolbarRadio extends ToolbarCheckedItem {
    type: ToolbarItemType.Radio;
    value: string | boolean | number;
}

export interface ToolbarCheckbox extends ToolbarCheckedItem {
    type: ToolbarItemType.Checkbox;
}

export interface ToolbarSwitch extends ToolbarCheckedItem {
    type: ToolbarItemType.Switch;
}

export interface ToolbarTextInput extends ToolbarCommandItem {
    type: ToolbarItemType.TextInput;
    value: string | Observable<string>;
    placeholder: string;
}

export interface ToolbarFileInput extends ToolbarCommandItem {
    type: ToolbarItemType.FileInput;
}

export interface ToolbarDivider extends ToolbarItem {
    type: ToolbarItemType.Divider;
}

export interface ToolbarMenuItem extends ToolbarCommandItem {
    type: ToolbarItemType.MenuItem;
}

export interface ToolbarDropDown extends ToolbarItem {
    type: ToolbarItemType.Dropdown;
    items: ToolbarItem[];
}

export interface ToolbarOption extends ToolbarObject {
    value: any;
    name: string;
}

export interface ToolbarSelect extends ToolbarCommandItem {
    type: ToolbarItemType.Select;
    value: any;
    options: ToolbarOption[];
}

export interface ToolbarItemGroup extends ToolbarObject {
    name?: string;
    visible: boolean;
    fill: boolean;
    items: ToolbarItem[];
}

export interface Toolbar {
    groups: ToolbarItemGroup[];
}

export function isToolbarSelect(item: ToolbarItem): item is ToolbarSelect {
    return item.type === ToolbarItemType.Select;
}
