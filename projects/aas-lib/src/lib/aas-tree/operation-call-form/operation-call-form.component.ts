/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASTreeApiService } from '../aas-tree-api.service';
import { messageToString } from '../../convert';
import { ERRORS } from '../../types/errors';
import {
    AASDocument,
    getLocaleValue,
    ApplicationError,
    determineType,
    getDefaultValue,
    isBooleanType,
    aas,
    isProperty,
    toInvariant,
    convertToString,
    toBoolean,
} from 'aas-core';

export interface VariableItem {
    submodelElement: aas.SubmodelElement;
    name: string;
    description?: string;
    type: aas.DataTypeDefXsd;
    value: string | boolean;
    inputType: 'text' | 'checkbox';
}

@Component({
    selector: 'fhg-operation-call',
    templateUrl: './operation-call-form.component.html',
    styleUrls: ['./operation-call-form.component.scss'],
    standalone: true,
    imports: [NgbToast, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationCallFormComponent {
    private operation: aas.Operation | undefined;
    private document: AASDocument | null = null;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AASTreeApiService,
    ) {}

    public readonly name = signal('');

    public readonly canCall = signal(true);

    public readonly inputVariables = signal<VariableItem[]>([]);

    public readonly outputVariables = signal<VariableItem[]>([]);

    public readonly messages = signal<string[]>([]);

    public result: aas.Operation | null = null;

    public initialize(document: AASDocument, operation: aas.Operation): void {
        this.document = document;
        this.operation = cloneDeep(operation);

        try {
            this.inputVariables.set(this.applyToView(this.operation.inputVariables));
            this.outputVariables.set(this.applyToView(this.operation.outputVariables));
        } catch (error) {
            this.messages.update(values => [...values, messageToString(error, this.translate)]);
            this.canCall.set(false);
        }
    }

    public async call(): Promise<void> {
        if (this.document && this.operation && this.canCall()) {
            this.messages.set([]);

            try {
                this.applyToModel();
                this.result = await this.api.invoke(this.document, this.operation);
                if (this.result && Array.isArray(this.result.outputVariables)) {
                    this.inputVariables.set(this.applyToView(this.result.inputVariables));
                    this.outputVariables.set(this.applyToView(this.result.outputVariables));
                }
            } catch (error) {
                this.messages.set([messageToString(error, this.translate)]);
            }
        }
    }

    public close(): void {
        this.modal.close();
    }

    private applyToModel(): void {
        for (const item of this.inputVariables()) {
            const element = item.submodelElement;
            if (isProperty(element)) {
                const value =
                    typeof item.value === 'boolean'
                        ? item.value.toString()
                        : toInvariant(item.value, item.type, this.translate.currentLang);

                if (value == null) {
                    throw new ApplicationError(
                        `The expression '${element.value}' for the variable '${element.idShort}' cannot be converted to the type '${element.valueType}'`,
                        ERRORS.INVALID_OPERATION_VARIABLE_EXPRESSION,
                        element.value,
                        element.idShort,
                        element.valueType,
                    );
                }

                element.value = value;
            } else {
                // ToDo:
            }
        }
    }

    private applyToView(sources: aas.OperationVariable[] | undefined): VariableItem[] {
        const values: VariableItem[] = [];
        if (!sources) return values;

        for (const sourceVariable of sources) {
            if (sourceVariable.value.modelType === 'Property') {
                const source = sourceVariable.value as aas.Property;
                const inputType = isBooleanType(source.valueType) ? 'checkbox' : 'text';

                let valueType: aas.DataTypeDefXsd | undefined;
                if (source.valueType) {
                    valueType = source.valueType;
                } else if (source.value) {
                    valueType = determineType(source.value);
                }

                if (!valueType) {
                    throw new ApplicationError(
                        `The data type of the variable "${source.idShort}" is undefined.`,
                        ERRORS.UNKNOWN_VARIABLE_VALUE_TYPE,
                        source.idShort,
                    );
                }

                let value = source.value;
                if (!value) {
                    value = convertToString(getDefaultValue(valueType), this.translate.currentLang);
                }

                values.push({
                    submodelElement: source,
                    name: source.idShort,
                    description: getLocaleValue(source.description),
                    type: valueType,
                    inputType: inputType,
                    value: inputType === 'checkbox' ? toBoolean(value) : value,
                });
            } else {
                const source = sourceVariable.value;
                values.push({
                    submodelElement: source,
                    name: source.idShort,
                    description: getLocaleValue(source.description),
                    type: 'xs:string',
                    inputType: 'text',
                    value: 'not implemented',
                });
            }
        }

        return values;
    }
}
