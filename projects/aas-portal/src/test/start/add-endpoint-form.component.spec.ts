/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASEndpoint } from 'common';
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
            providers: [NgbActiveModal],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
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

    it('submits endpoint Name: "My endpoint", URL: "file:///my-endpoint"', () => {
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.item.set({ ...component.items()[3], value: 'file:///my-endpoint' });
        component.name.set('My endpoint');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('My endpoint');
        expect(endpoint?.url).toEqual('file:///my-endpoint');
        expect(endpoint?.type).toEqual('FileSystem');
    });

    it('submits AAS endpoint Name: "My endpoint", URL: "file:///a\\b\\my-endpoint"', () => {
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.item.set({ ...component.items()[3], value: 'file:///a\\b\\my-endpoint' });
        component.name.set('My endpoint');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('My endpoint');
        expect(endpoint?.url).toEqual('file:///a/b/my-endpoint');
        expect(endpoint?.type).toEqual('FileSystem');
    });

    it('ignores AAS endpoint: Name: "", URL: "file:///my-endpoint"', () => {
        spyOn(modal, 'close');

        component.item.set({ ...component.items()[3], value: 'file:///my-endpoint' });
        component.name.set('');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('ignores AAS endpoint Name: "My endpoint", URL: "file:///"', () => {
        spyOn(modal, 'close');

        component.item.set({ ...component.items()[3], value: 'file:///' });
        component.name.set('My endpoint');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('submits AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://localhost:30001/I4AASServer"', () => {
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.item.set({ ...component.items()[1], value: 'opc.tcp://localhost:30001/I4AASServer' });
        component.name.set('I4AAS Server');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('I4AAS Server');
        expect(endpoint?.url).toEqual('opc.tcp://localhost:30001/I4AASServer');
        expect(endpoint?.type).toEqual('OpcuaServer');
    });

    it('ignores AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://"', () => {
        spyOn(modal, 'close');

        component.item.set(component.items()[1]);
        fixture.detectChanges();

        inputNameElement.value = 'I4AAS Server';
        inputNameElement.dispatchEvent(new Event('input'));
        inputUrlElement.value = 'opc.tcp://';
        inputUrlElement.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('submits AASX server Name: "AASX Server", URL: "http://localhost:50001/"', () => {
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.item.set({ ...component.items()[0], value: 'http://localhost:50001/' });
        component.name.set('AASX Server');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('AASX Server');
        expect(endpoint?.url).toEqual('http://localhost:50001/');
        expect(endpoint?.type).toEqual('AASServer');
    });

    it('submits WebDAV server Name: "WebDAV", URL: "http://localhost:8080/root/folder"', () => {
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.item.set({ ...component.items()[2], value: 'http://localhost:8080/root/folder' });
        component.name.set('WebDAV Server');

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('WebDAV Server');
        expect(endpoint?.url).toEqual('http://localhost:8080/root/folder');
        expect(endpoint?.type).toEqual('WebDAV');
    });
});
