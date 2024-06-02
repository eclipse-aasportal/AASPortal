/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
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
} from 'common';

export interface Bla {
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
    imports: [NgbToast, FormsModule],
})
export class OperationCallFormComponent {
    private _operation!: aas.Operation;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AASTreeApiService,
    ) {}

    public name = '';

    public document: AASDocument | null = null;

    public result: aas.Operation | null = null;

    public canCall = true;

    public get operation(): aas.Operation {
        return this._operation;
    }

    public set operation(value: aas.Operation) {
        this._operation = cloneDeep(value);
        try {
            this.applyToView(this._operation.inputVariables, this.inputVariables);
            this.applyToView(this._operation.outputVariables, this.outputVariables);
        } catch (error) {
            this.messages.push(messageToString(error, this.translate));
            this.canCall = false;
        }
    }

    public readonly inputVariables: Bla[] = [];

    public readonly outputVariables: Bla[] = [];

    public messages: string[] = [];

    public async call(): Promise<void> {
        if (this.document && this.canCall) {
            this.messages = [];

            try {
                this.result = await this.api.invoke(this.document, this.applyToModel());
                if (this.result && Array.isArray(this.result.outputVariables)) {
                    this.applyToView(this.result.inputVariables, this.inputVariables);
                    this.applyToView(this.result.outputVariables, this.outputVariables);
                }
            } catch (error) {
                this.messages.push(messageToString(error, this.translate));
            }
        }
    }

    public close(): void {
        this.modal.close();
    }

    private applyToModel(): aas.Operation {
        for (const item of this.inputVariables) {
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

        return this._operation;
    }

    private applyToView(sources: aas.OperationVariable[] | undefined, targets: Bla[]): void {
        targets.splice(0, targets.length);
        if (sources) {
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

                    targets.push({
                        submodelElement: source,
                        name: source.idShort,
                        description: getLocaleValue(source.description),
                        type: valueType,
                        inputType: inputType,
                        value: inputType === 'checkbox' ? toBoolean(value) : value,
                    });
                } else {
                    const source = sourceVariable.value;
                    targets.push({
                        submodelElement: source,
                        name: source.idShort,
                        description: getLocaleValue(source.description),
                        type: 'xs:string',
                        inputType: 'text',
                        value: 'not implemented',
                    });
                }
            }
        }
    }
}
