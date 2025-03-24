/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { aas, AASDocument, convertToString } from 'aas-core';
import { cloneDeep } from 'lodash-es';
import { OperationCallFormComponent } from '../../lib/operation-call-form/operation-call-form.component';
import { sampleDocument } from '../assets/sample-document';
import { ERRORS } from '../../lib/errors';
import { OperationCallFormApiService } from '../../lib/operation-call-form/operation-call-form-api.service';

describe('OperationCallFormComponent', () => {
    let component: OperationCallFormComponent;
    let fixture: ComponentFixture<OperationCallFormComponent>;
    let operation: aas.Operation;
    let api: jasmine.SpyObj<OperationCallFormApiService>;
    let document: AASDocument;

    beforeEach(() => {
        api = jasmine.createSpyObj<OperationCallFormApiService>(['invoke']);
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [NgbModal, NgbActiveModal],
        });

        TestBed.overrideComponent(OperationCallFormComponent, {
            remove: {
                providers: [OperationCallFormApiService],
            },
            add: {
                providers: [
                    {
                        provide: OperationCallFormApiService,
                        useValue: api,
                    },
                ],
            },
        });

        fixture = TestBed.createComponent(OperationCallFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        document = sampleDocument;

        operation = {
            category: 'CONSTANT',
            methodId: '123',
            modelType: 'Operation',
            idShort: 'convert',
            objectId: 'abc',
            inputVariables: [],
            inoutputVariables: [],
            outputVariables: [],
        };
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('calls an operation like toUpperCase(input: string): string', (done: DoneFn) => {
        operation.inputVariables = [createVariable('inString', 'xs:string', '')];
        operation.outputVariables = [createVariable('outString', 'xs:string', '')];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = 'Hello World!';
        (resultOp.outputVariables![0].value as aas.Property).value = 'Hello World!'.toUpperCase();
        api.invoke.and.returnValue(of(resultOp));
        component.initialize(document, operation);
        component.inputVariables()[0].value = 'Hello World!';

        component.call().subscribe(() => {
            expect(component.inputVariables()[0].value).toEqual('Hello World!');
            expect(component.outputVariables()[0].value).toEqual('HELLO WORLD!');
            done();
        });
    });

    it('calls an operation like toggle(in: boolean): boolean', (done: DoneFn) => {
        operation.inputVariables = [createVariable('in', 'xs:boolean', false)];
        operation.outputVariables = [createVariable('out', 'xs:boolean', false)];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = 'false';
        (resultOp.outputVariables![0].value as aas.Property).value = 'true';
        api.invoke.and.returnValue(of(resultOp));
        component.initialize(document, operation);
        component.inputVariables()[0].value = false;

        component.call().subscribe(() => {
            expect(component.inputVariables()[0].value).toEqual(false);
            expect(component.outputVariables()[0].value).toEqual(true);
            done();
        });
    });

    it('calls an operation like increment(in: number): number', (done: DoneFn) => {
        operation.inputVariables = [createVariable('in', 'xs:int', 0)];
        operation.outputVariables = [createVariable('out', 'xs:int', 0)];

        const resultOp = cloneDeep(operation);
        (resultOp.inputVariables![0].value as aas.Property).value = '42';
        (resultOp.outputVariables![0].value as aas.Property).value = '43';
        api.invoke.and.returnValue(of(resultOp));
        component.initialize(document, operation);
        component.inputVariables()[0].value = '42';

        component.call().subscribe(() => {
            expect(component.inputVariables()[0].value).toEqual('42');
            expect(component.outputVariables()[0].value).toEqual('43');
            done();
        });
    });

    it('validates an input variable with undefined value (int => 0)', () => {
        operation.inputVariables = [createVariable('in', 'xs:int')];
        component.initialize(document, operation);
        expect(component.inputVariables()[0].value).toEqual('0');
    });

    it('validates an input variable with undefined value type (0 => int)', () => {
        operation.inputVariables = [createVariable('in', undefined, 0)];
        component.initialize(document, operation);
        expect(component.inputVariables()[0].type).toEqual('xs:int');
    });

    it('shows the message ERROR_UNKNOWN_VARIABLE_VALUE_TYPE if variable data type is undefined', () => {
        operation.inputVariables = [createVariable('in')];
        component.initialize(document, operation);
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].startsWith(ERRORS.UNKNOWN_VARIABLE_VALUE_TYPE)).toBeTrue();
        expect(component.canCall()).toBeFalse();
    });

    it('shows the message ERROR_INVALID_OPERATION_VARIABLE_EXPRESSION if an input variable expression is invalid', (done: DoneFn) => {
        operation.inputVariables = [createVariable('in', 'xs:int', 0)];
        operation.outputVariables = [createVariable('out', 'xs:int', 0)];
        api.invoke.and.returnValue(of(cloneDeep(operation)));
        component.initialize(document, operation);
        component.inputVariables()[0].value = 'invalid';

        component.call().subscribe(() => {
            expect(component.messages().length).toEqual(1);
            expect(component.messages()[0].startsWith(ERRORS.INVALID_OPERATION_VARIABLE_EXPRESSION)).toBeTrue();
            expect(component.canCall()).toBeTrue();
            done();
        });
    });

    function createVariable(name: string, valueType?: aas.DataTypeDefXsd, value?: unknown): aas.OperationVariable {
        return {
            value: {
                modelType: 'Property',
                idShort: name,
                valueType: valueType,
                value: convertToString(value),
            } as aas.Property,
        };
    }
});