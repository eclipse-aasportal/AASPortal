/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ToolbarService } from './toolbar.service';
import {
    ToolbarDropDown,
    ToolbarItem,
    ToolbarItemGroup,
    ToolbarItemType,
    ToolbarRadio,
    ToolbarTextInput,
    ToolbarColorPicker,
    ToolbarOption,
    ToolbarSelect,
    ToolbarCommandItem,
    ToolbarCheckedItem as ToolbarCheckedItem
} from './toolbar';

@Component({
    selector: 'fhg-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy {
    private readonly subscription = new Subscription();

    constructor(
        private translate: TranslateService,
        private toolbar: ToolbarService) { }

    public groups: ToolbarItemGroup[] = [];

    public ngOnInit(): void {
        this.subscription.add(this.toolbar.groups.subscribe(
            (values) => this.groups = values
        ));
    }

    public ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    public getName(item: ToolbarItem): string | undefined {
        if (typeof item.name === 'string') {
            return this.translate.instant(item.name);
        }

        return '';
    }

    public getValue(item: ToolbarItem): any {
        if (this.isRadio(item)) {
            return item.value;
        }

        if (this.isColorPicker(item)) {
            return item.value;
        }

        if (this.isSelect(item)) {
            return item.value;
        }

        if (this.isTextInput(item)) {
            return item.value;
        }

        return null;
    }

    public isChecked(item: ToolbarItem): boolean {
        return this.isCheckedItem(item) ? item.checked : false;
    }

    public getPlaceholder(item: ToolbarItem): string {
        if (this.isTextInput(item)) {
            return this.translate.instant(item.placeholder);
        }

        return '';
    }

    public getDropdownItems(item: ToolbarItem): ToolbarItem[] {
        return this.isDropdown(item) ? item.items : [];
    }

    public getOptions(item: ToolbarItem): ToolbarOption[] {
        return this.isSelect(item) ? item.options : [];
    }

    public isSelected(item: ToolbarItem, option: ToolbarOption): boolean {
        return this.isSelect(item) ? item.value === option.value : false;
    }

    public canExecute(item: ToolbarItem, argument?: any): boolean {
        if (this.isSelect(item)) {
            const element = argument as HTMLSelectElement;
            return element && element.selectedIndex >= 0 &&
                item.command.canExecute(element.options[element.selectedIndex].value);
        }

        if (this.isCommandItem(item)) {
            return item.command.canExecute(argument);
        }

        return false;
    }

    public execute(item: ToolbarItem, argument?: any): void {
        if (this.isSelect(item)) {
            const element = argument as HTMLSelectElement;
            if (element && element.selectedIndex >= 0) {
                item.command.execute(element.options[element.selectedIndex].value);
            }
        }
        else if (this.isCommandItem(item)) {
            item.command.execute(argument);
        }
    }

    public isButtonGroup(group: ToolbarItemGroup): boolean {
        return group.items.every(
            item => item.type === ToolbarItemType.Button ||
                item.type === ToolbarItemType.Dropdown ||
                item.type === ToolbarItemType.Radio ||
                item.type === ToolbarItemType.Checkbox);
    }

    private isCommandItem(item: ToolbarItem): item is ToolbarCommandItem {
        return 'command' in item;
    }

    private isRadio(item: ToolbarItem): item is ToolbarRadio {
        return item.type === ToolbarItemType.Radio;
    }

    private isCheckedItem(item: ToolbarItem): item is ToolbarCheckedItem {
        return 'checked' in item;
    }

    private isTextInput(item: ToolbarItem): item is ToolbarTextInput {
        return item.type === ToolbarItemType.TextInput;
    }

    private isDropdown(item: ToolbarItem): item is ToolbarDropDown {
        return item.type === ToolbarItemType.Dropdown;
    }

    private isColorPicker(item: ToolbarItem): item is ToolbarColorPicker {
        return item.type === ToolbarItemType.ColorPicker;
    }

    private isSelect(item: ToolbarItem): item is ToolbarSelect {
        return item.type === ToolbarItemType.Select;
    }
}