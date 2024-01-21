/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { aas, AASDocument, convertToString } from 'common';
import { cloneDeep } from 'lodash-es';
import { AASTreeApiService } from '../../lib/aas-tree/aas-tree-api.service';
import { OperationCallFormComponent } from '../../lib/aas-tree/operation-call-form/operation-call-form.component';
import { sampleDocument } from '../assets/sample-document';
import { ERRORS } from '../../lib/types/errors';

describe('OperationCallFormComponent', () => {
    let component: OperationCallFormComponent;
    let fixture: ComponentFixture<OperationCallFormComponent>;
    let operation: aas.Operation;
    let api: AASTreeApiService;
    let document: AASDocument;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [OperationCallFormComponent],
            providers: [
                NgbModal,
                NgbActiveModal
            ],
            imports: [
                HttpClientTestingModule,
                CommonModule,
                FormsModule,
                NgbModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        api = TestBed.inject(AASTreeApiService);
        fixture = TestBed.createComponent(OperationCallFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        document = sampleDocument;

        operation = {
            category: 'CONSTANT',
            kind: 'Instance',
            methodId: '123',
            modelType: 'Operation',
            idShort: 'convert',
            objectId: 'abc',
            inputVariables: [],
            inoutputVariables: [],
            outputVariables: []
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('calls an operation like toUpperCase(input: string): string', async function () {
        operation.inputVariables = [createVariable('inString', 'xs:string', '')];
        operation.outputVariables = [createVariable('outString', 'xs:string', '')];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = 'Hello World!';
        (resultOp.outputVariables![0].value as aas.Property).value = 'Hello World!'.toUpperCase();

        spyOn(api, 'invoke').and.returnValue(new Promise<aas.Operation>((result) => result(resultOp)))
        component.document = document;
        component.operation = operation;
        component.inputVariables[0].value = 'Hello World!';

        await component.call();

        expect(component.inputVariables[0].value).toEqual('Hello World!');
        expect(component.outputVariables[0].value).toEqual('HELLO WORLD!');
    });

    it('calls an operation like toggle(in: boolean): boolean', async function () {
        operation.inputVariables = [createVariable('in', 'xs:boolean', false)];
        operation.outputVariables = [createVariable('out', 'xs:boolean', false)];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = 'false';
        (resultOp.outputVariables![0].value as aas.Property).value = 'true';

        spyOn(api, 'invoke').and.returnValue(new Promise<aas.Operation>((result) => result(resultOp)))
        component.document = document;
        component.operation = operation;
        component.inputVariables[0].value = false;

        await component.call();

        expect(component.inputVariables[0].value).toEqual(false);
        expect(component.outputVariables[0].value).toEqual(true);
    });

    it('calls an operation like increment(in: number): number', async function () {
        operation.inputVariables = [createVariable('in', 'xs:int', 0)];
        operation.outputVariables = [createVariable('out', 'xs:int', 0)];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = '42';
        (resultOp.outputVariables![0].value as aas.Property).value = '43';

        spyOn(api, 'invoke').and.returnValue(new Promise<aas.Operation>((result) => result(resultOp)))
        component.document = document;
        component.operation = operation;
        component.inputVariables[0].value = '42';

        await component.call();

        expect(component.inputVariables[0].value).toEqual('42');
        expect((component.result?.outputVariables![0].value as aas.Property).value).toEqual('43');
        expect(component.outputVariables[0].value).toEqual('43');
    });

    it('validates an input variable with undefined value (int => 0)', async function () {
        operation.inputVariables = [createVariable('in', 'xs:int')];
        component.operation = operation;
        expect(component.inputVariables[0].value).toEqual('0');
    });

    it('validates an input variable with undefined value type (0 => int)', async function () {
        operation.inputVariables = [createVariable('in', undefined, 0)];
        component.operation = operation;
        expect(component.inputVariables[0].type).toEqual('xs:int');
    });

    it('shows the message ERROR_UNKNOWN_VARIABLE_VALUE_TYPE if variable data type is undefined', function () {
        operation.inputVariables = [createVariable('in')];
        component.operation = operation;
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].startsWith(ERRORS.UNKNOWN_VARIABLE_VALUE_TYPE)).toBeTrue();
        expect(component.canCall).toBeFalse();
    });

    it('shows the message ERROR_INVALID_OPERATION_VARIABLE_EXPRESSION if an input variable expression is invalid', async function () {
        operation.inputVariables = [createVariable('in', 'xs:int', 0)];
        operation.outputVariables = [createVariable('out', 'xs:int', 0)];

        const dummy = cloneDeep(operation);
        spyOn(api, 'invoke').and.returnValue(new Promise<aas.Operation>((result) => result(dummy)))

        component.document = document;
        component.operation = operation;
        component.inputVariables[0].value = 'invalid';

        await component.call();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].startsWith(ERRORS.INVALID_OPERATION_VARIABLE_EXPRESSION)).toBeTrue();
        expect(component.canCall).toBeTrue();
    });

    function createVariable(name: string, valueType?: aas.DataTypeDefXsd, value?: any): aas.OperationVariable {
        return {
            value: {
                modelType: 'Property',
                idShort: name,
                kind: 'Instance',
                valueType: valueType,
                value: convertToString(value)
            } as aas.Property
        };
    }
});