/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AddEndpointFormComponent } from '../../app/start/add-endpoint-form/add-endpoint-form.component';

describe('AddEndpointFormComponent', () => {
    let component: AddEndpointFormComponent;
    let fixture: ComponentFixture<AddEndpointFormComponent>;
    let inputNameElement: HTMLInputElement;
    let inputUrlElement: HTMLInputElement;
    let modal: NgbActiveModal;
    let form: HTMLFormElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddEndpointFormComponent
            ],
            providers: [
                NgbActiveModal
            ],
            imports: [
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

        fixture = TestBed.createComponent(AddEndpointFormComponent);
        modal = TestBed.inject(NgbActiveModal);
        component = fixture.componentInstance;
        fixture.detectChanges();

        form = fixture.debugElement.nativeElement.querySelector('form');
        inputNameElement = fixture.debugElement.nativeElement.querySelector('#input-endpoint-name');
        inputUrlElement = fixture.debugElement.nativeElement.querySelector('#input-endpoint-url');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('submits endpoint Name: "My endpoint", URL: "file:///my-endpoint"', function () {
        let endpoint: string | undefined;
        spyOn(modal, 'close').and.callFake((result) => endpoint = result);

        component.item = component.items[3];
        component.name = 'My endpoint';
        component.item.value = 'file:///my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint).toEqual('file:///my-endpoint?name=My+endpoint');
    });

    it('submits AAS endpoint Name: "My endpoint", URL: "file:///a\\b\\my-endpoint"', function () {
        let endpoint: string | undefined;
        spyOn(modal, 'close').and.callFake((result) => endpoint = result);

        component.item = component.items[3];
        component.name = 'My endpoint';
        component.item.value = 'file:///a\\b\\my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint).toEqual('file:///a/b/my-endpoint?name=My+endpoint');
    });

    it('ignores AAS endpoint: Name: "", URL: "file:///my-endpoint"', function () {
        spyOn(modal, 'close');

        component.item = component.items[3];
        component.name = '';
        component.item.value = 'file:///my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages.length > 0).toBeTrue();
    });

    it('ignores AAS endpoint Name: "My endpoint", URL: "file:///"', function () {
        spyOn(modal, 'close');

        component.item = component.items[3];
        component.name = 'My endpoint';
        component.item.value = 'file:///';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages.length > 0).toBeTrue();
    });

    it('submits AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://172.16.160.178:30001/I4AASServer"', function () {
        let endpoint: string | undefined;
        spyOn(modal, 'close').and.callFake((result) => endpoint = result);

        component.item = component.items[2];
        component.name = 'I4AAS Server';
        component.item.value = 'opc.tcp://172.16.160.178:30001/I4AASServer';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint).toEqual('opc.tcp://172.16.160.178:30001/I4AASServer?name=I4AAS+Server');
    });

    it('ignores AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://"', function () {
        spyOn(modal, 'close');

        component.item = component.items[2];
        fixture.detectChanges();

        inputNameElement.value = 'I4AAS Server';
        inputNameElement.dispatchEvent(new Event('input'));
        inputUrlElement.value = 'opc.tcp://';
        inputUrlElement.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages.length > 0).toBeTrue();
    });

    it('submits AAS registry Name: "AAS Registry", URL: "http://172.16.160.188:50000/registry/api/v1/registry/"', function () {
        let endpoint: string | undefined;
        spyOn(modal, 'close').and.callFake((result) => endpoint = result);

        component.item = component.items[1];
        component.name = 'AAS Registry';
        component.item.value = 'http://172.16.160.188:50000/registry/api/v1/registry/';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint).toEqual('http://172.16.160.188:50000/registry/api/v1/registry/?name=AAS+Registry&type=AASRegistry');
    });

    it('ignores endpoint Name: "AAS Registry", URL: "http://"', function () {
        spyOn(modal, 'close');

        component.item = component.items[1];
        component.name = 'AAS Registry';
        component.item.value = 'http://';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages.length > 0).toBeTrue();
    });

    it('submits AASX server Name: "AASX Server", URL: "http://172.16.160.188:50001/"', function () {
        let endpoint: string | undefined;
        spyOn(modal, 'close').and.callFake((result) => endpoint = result);

        component.item = component.items[0];
        component.name = 'AASX Server';
        component.item.value = 'http://172.16.160.188:50001/';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint).toEqual('http://172.16.160.188:50001/?name=AASX+Server');
    });
});