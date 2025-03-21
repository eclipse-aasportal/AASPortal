/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { catchError, EMPTY, map, mergeMap, Observable, of } from 'rxjs';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    isReferenceElement,
} from 'aas-core';

import { messageToString } from '../convert';
import { ERRORS } from '../types/errors';
import { OperationCallFormApiService } from './operation-call-form-api.service';

export interface VariableItem {
    submodelElement: aas.SubmodelElement;
    name: string;
    description?: string;
    type: aas.DataTypeDefXsd | '-';
    value: string | boolean;
    inputType: 'text' | 'checkbox';
}

@Component({
    selector: 'fhg-operation-call',
    templateUrl: './operation-call-form.component.html',
    styleUrls: ['./operation-call-form.component.scss'],
    imports: [NgbToast, FormsModule, TranslateModule],
    providers: [OperationCallFormApiService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationCallFormComponent {
    private operation: aas.Operation | undefined;
    private document: AASDocument | null = null;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: OperationCallFormApiService,
    ) {}

    public readonly name = signal('');

    public readonly canCall = signal(true);

    public readonly inputVariables = signal<VariableItem[]>([]);

    public readonly inoutputVariables = signal<VariableItem[]>([]);

    public readonly outputVariables = signal<VariableItem[]>([]);

    public readonly messages = signal<string[]>([]);

    public initialize(document: AASDocument, operation: aas.Operation): void {
        this.document = document;
        this.operation = cloneDeep(operation);
        delete this.operation.parent;

        try {
            this.name.set(this.operation.idShort);
            this.inputVariables.set(this.applyToView(this.operation.inputVariables));
            this.inoutputVariables.set(this.applyToView(this.operation.inoutputVariables));
            this.outputVariables.set(this.applyToView(this.operation.outputVariables));
        } catch (error) {
            this.messages.update(values => [...values, messageToString(error, this.translate)]);
            this.canCall.set(false);
        }
    }

    public call(): Observable<void> {
        return of(void 0).pipe(
            mergeMap(() => {
                if (!this.document || !this.operation || !this.canCall()) {
                    return EMPTY;
                }

                this.messages.set([]);
                this.applyToModel();
                return this.api.invoke(this.document, this.operation);
            }),
            map(result => {
                if (result && Array.isArray(result.outputVariables)) {
                    this.inputVariables.set(this.applyToView(result.inputVariables));
                    this.inoutputVariables.set(this.applyToView(result.inoutputVariables));
                    this.outputVariables.set(this.applyToView(result.outputVariables));
                }
            }),
            catchError(error => {
                this.messages.set([messageToString(error, this.translate)]);
                return of(void 0);
            }),
        );
    }

    public close(): void {
        this.modal.close();
    }

    private applyToModel(): void {
        for (const item of [...this.inputVariables(), ...this.inoutputVariables()]) {
            const element = item.submodelElement;
            if (isProperty(element)) {
                const value =
                    typeof item.value === 'boolean'
                        ? item.value.toString()
                        : toInvariant(item.value, item.type as aas.DataTypeDefXsd, this.translate.currentLang);

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
            }
        }
    }

    private applyToView(sources: aas.OperationVariable[] | undefined): VariableItem[] {
        const values: VariableItem[] = [];
        if (!sources) return values;

        for (const sourceVariable of sources) {
            const source = sourceVariable.value;
            delete source.parent;
            if (isProperty(source)) {
                delete source.nodeId;
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
            } else if (isReferenceElement(source) && source.value) {
                values.push({
                    submodelElement: source,
                    name: source.idShort,
                    description: getLocaleValue(source.description),
                    type: '-',
                    inputType: 'text',
                    value: source.value.keys.map(key => key.value).join('.'),
                });
            } else {
                const source = sourceVariable.value;
                values.push({
                    submodelElement: source,
                    name: source.idShort,
                    description: getLocaleValue(source.description),
                    type: '-',
                    inputType: 'text',
                    value: source.modelType,
                });
            }
        }

        return values;
    }
}
