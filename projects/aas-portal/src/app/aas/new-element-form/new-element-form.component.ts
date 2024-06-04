/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { Observable, map } from 'rxjs';
import { TemplateService } from 'aas-lib';
import { TemplateDescriptor, aas, getChildren, isEnvironment } from 'common';
import head from 'lodash-es/head';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'fhg-new-element',
    templateUrl: './new-element-form.component.html',
    styleUrls: ['./new-element-form.component.scss'],
    standalone: true,
    imports: [NgbToast, FormsModule, AsyncPipe],
})
export class NewElementFormComponent {
    private env?: aas.Environment;
    private parent?: aas.Referable;
    private _modelType?: aas.ModelType;
    private _template?: TemplateDescriptor;

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly api: TemplateService,
    ) {
        this.templates = this.api.getTemplates().pipe(
            map(values => {
                const templates = this.modelType ? values.filter(item => item.modelType === this.modelType) : values;
                this.template = head(templates);
                return [{ idShort: '-', template: null, modelType: '' }, ...templates];
            }),
        );
    }

    public modelTypes: aas.ModelType[] = [];

    public get modelType(): aas.ModelType | undefined {
        return this._modelType;
    }

    public set modelType(value: aas.ModelType | undefined) {
        this._modelType = value;
    }

    public readonly templates: Observable<TemplateDescriptor[]>;

    public get template(): TemplateDescriptor | undefined {
        return this._template;
    }

    public set template(value: TemplateDescriptor | undefined) {
        this._template = value;
        this.idShort = value?.idShort ?? '';
    }

    public idShort = '';

    public messages: string[] = [];

    public cancel() {
        this.modal.close();
    }

    public initialize(env: aas.Environment, parent: aas.Referable): void {
        this.env = env;
        this.parent = parent;

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
            this.api.getTemplate(this._template!.endpoint!).subscribe(template => {
                if (isEnvironment(template)) {
                    template.submodels[0].idShort = this.idShort;
                } else {
                    template.idShort = this.idShort;
                }
                return this.modal.close(template);
            });
        }
    }

    private validate(): boolean {
        if (!this.idShort || !this.parent || !this.env || !this._template?.endpoint) {
            this.pushMessage(`Invalid name.`);
            return false;
        }

        const children = getChildren(this.parent, this.env);
        if (children.some(child => child.idShort === this.idShort)) {
            this.pushMessage(`A ${this.modelType} with the name "${this.idShort}" already exists.`);
            return false;
        }

        if (this._template.modelType === 'Submodel') {
            const id = this._template.id;
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
