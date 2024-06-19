/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, signal } from '@angular/core';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TemplateService } from 'aas-lib';
import { TemplateDescriptor, aas, getChildren, isEnvironment } from 'common';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ModelType } from 'projects/common/dist/types/aas';

@Component({
    selector: 'fhg-new-element',
    templateUrl: './new-element-form.component.html',
    styleUrls: ['./new-element-form.component.scss'],
    standalone: true,
    imports: [NgbToast, FormsModule, AsyncPipe, TranslateModule],
})
export class NewElementFormComponent {
    private readonly _messages = signal<string[]>([]);
    private readonly _modelTypes = signal<ModelType[]>([]);
    private env?: aas.Environment;
    private parent?: aas.Referable;

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly api: TemplateService,
    ) {}

    public readonly modelTypes = this._modelTypes.asReadonly();

    public readonly modelType = signal<aas.ModelType | undefined>(undefined);

    public readonly templates = computed(() => [
        { idShort: '-', template: null, modelType: '' } as TemplateDescriptor,
        ...this.api.templates(),
    ]);

    public readonly template = signal<TemplateDescriptor | undefined>(undefined);

    public readonly idShort = computed(() => this.template()?.idShort ?? '');

    public readonly messages = this._messages.asReadonly();

    public cancel() {
        this.modal.close();
    }

    public initialize(env: aas.Environment, parent: aas.Referable): void {
        this.env = env;
        this.parent = parent;

        switch (this.parent.modelType) {
            case 'AssetAdministrationShell':
                this._modelTypes.set(['Submodel']);
                this.modelType.set('Submodel');
                break;
            case 'Submodel':
                this._modelTypes.set([
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                ]);
                this.modelType.set('Property');
                break;
            case 'SubmodelElementCollection':
                this._modelTypes.set([
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                ]);
                this.modelType.set('SubmodelElementCollection');
                break;
            case 'SubmodelElementList':
                this._modelTypes.set([
                    'MultiLanguageProperty',
                    'Property',
                    'SubmodelElementCollection',
                    'SubmodelElementList',
                ]);
                this.modelType.set('SubmodelElementList');
        }
    }

    public submit(): void {
        this.clearMessages();
        if (this.validate()) {
            this.api.getTemplate(this.template()!.endpoint!).subscribe(template => {
                if (isEnvironment(template)) {
                    template.submodels[0].idShort = this.idShort();
                } else {
                    template.idShort = this.idShort();
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
        if (children.some(child => child.idShort === this.idShort())) {
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
        this._messages.update(values => [...values, message]);
    }

    private clearMessages(): void {
        this._messages.set([]);
    }
}
