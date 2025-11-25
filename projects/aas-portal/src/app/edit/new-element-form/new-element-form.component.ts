/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { messageToString, TemplateService } from 'aas-lib';
import { aas, ApplicationError, jsonization, toJsonValue, types } from 'aas-core';

@Component({
    selector: 'fhg-new-element',
    templateUrl: './new-element-form.component.html',
    styleUrls: ['./new-element-form.component.scss'],
    imports: [NgbToast, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewElementFormComponent {
    private readonly modal = inject(NgbActiveModal);
    private readonly service = inject(TemplateService);
    private readonly translate = inject(TranslateService);
    private readonly _messages = signal<string[]>([]);
    private readonly _modelTypes = signal<aas.ModelType[]>([]);
    private env?: aas.Environment;
    private parent?: aas.Referable;

    public readonly modelTypes = this._modelTypes.asReadonly();

    public readonly modelType = signal<aas.ModelType | undefined>(undefined);

    public readonly templates = this.service.templates;

    public readonly template = this.service.template;

    public readonly messages = this._messages.asReadonly();

    public readonly idShort = signal('');

    public cancel(): void {
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
                break;
        }
    }

    public async submit(): Promise<void> {
        this.clearMessages();
        try {
            const env = await this.service.getTemplate();
            return this.modal.close(env);
        } catch (error) {
            this.pushMessage(messageToString(error, this.translate));
        }
    }

    private validate(submodel: types.Submodel | undefined): void {
        if (!submodel) {
            throw new ApplicationError('Error.UNABLE_TO_GET_SUBMODEL_TEMPLATE', { name: this.template() });
        }

        jsonization.submodelFromJsonable(toJsonValue(submodel)).mustValue();
    }

    private pushMessage(message: string): void {
        this._messages.update(values => [...values, message]);
    }

    private clearMessages(): void {
        this._messages.set([]);
    }
}
