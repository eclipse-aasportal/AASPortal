/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TemplateDescriptor, aas, getChildren, isSubmodel } from 'common';
import { cloneDeep, head } from 'lodash-es';

export interface NewElementResult {
    index?: number;
    element: aas.Referable;
}

@Component({
    selector: 'fhg-new-element',
    templateUrl: './new-element-form.component.html',
    styleUrls: ['./new-element-form.component.scss'],
})
export class NewElementFormComponent {
    private env?: aas.Environment;
    private parent?: aas.Referable;
    private _templates: TemplateDescriptor[] = [];
    private _modelType?: aas.ModelType;
    private _template?: TemplateDescriptor;

    public constructor(private readonly modal: NgbActiveModal) {}

    public modelTypes: aas.ModelType[] = [];

    public get modelType(): aas.ModelType | undefined {
        return this._modelType;
    }

    public set modelType(value: aas.ModelType | undefined) {
        this._modelType = value;
        this.template = head(this.templates);
    }

    public get templates(): TemplateDescriptor[] {
        return this.modelType
            ? this._templates.filter(item => item.template?.modelType === this.modelType)
            : this._templates;
    }

    public get template(): TemplateDescriptor | undefined {
        return this._template;
    }

    public set template(value: TemplateDescriptor | undefined) {
        this._template = value;
        this.idShort = value?.template?.idShort ?? '';
    }

    public idShort = '';

    public messages: string[] = [];

    public cancel() {
        this.modal.close();
    }

    public initialize(env: aas.Environment, parent: aas.Referable, templates: TemplateDescriptor[]): void {
        this.env = env;
        this.parent = parent;
        this.templates.push({ name: '-' }, ...templates);

        switch (this.parent.modelType) {
            case 'AssetAdministrationShell':
                this.modelTypes.push('Submodel');
                this.modelType = 'Submodel';
                break;
            case 'Submodel':
                this.modelTypes.push(
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                );
                this.modelType = 'Property';
                break;
            case 'SubmodelElementCollection':
                this.modelTypes.push(
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                );
                this.modelType = 'SubmodelElementCollection';
                break;
            case 'SubmodelElementList':
                this.modelTypes.push(
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                );
                this.modelType = 'SubmodelElementList';
        }
    }

    public submit(): void {
        this.clearMessages();
        if (this.validate()) {
            this.modal.close({
                element: this.createElement(),
            } as NewElementResult);
        }
    }

    private createElement(): aas.Referable {
        const element = cloneDeep(this.template!.template!);
        element.idShort = this.idShort;
        return element;
    }

    private validate(): boolean {
        if (!this.idShort || !this.parent || !this.env || !this.template?.template) {
            this.pushMessage(`Invalid name.`);
            return false;
        }

        const children = getChildren(this.parent, this.env);
        if (children.some(child => child.idShort === this.idShort)) {
            this.pushMessage(`A ${this.modelType} with the name "${this.idShort}" already exists.`);
            return false;
        }

        if (isSubmodel(this.template.template)) {
            const id = this.template.template.id;
            if (this.env.submodels.some(child => child.id === id)) {
                this.pushMessage(`A ${this.modelType} with the identification "${id}" already exists.`);
                return false;
            }
        }

        return true;
    }

    private pushMessage(message: string): void {
        this.messages = [message];
    }

    private clearMessages(): void {
        this.messages = [];
    }
}
