/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AASEndpoint } from 'aas-core';
import { AddEndpointFormComponent } from '../../app/shells/add-endpoint-form/add-endpoint-form.component';
import { FakeLoader } from '../mocks';

describe('AddEndpointFormComponent', () => {
    let modal: NgbActiveModal;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [NgbActiveModal, provideZonelessChangeDetection()],
            imports: [
                AddEndpointFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        modal = TestBed.inject(NgbActiveModal);
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('submits endpoint Name: "My endpoint", URL: "file:///my-endpoint"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.selectItem(component.items()[3]);
        component.name.set('My endpoint');
        component.selectedItem().value = 'file:///my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('My endpoint');
        expect(endpoint?.url).toEqual('file:///my-endpoint');
        expect(endpoint?.type).toEqual('FileSystem');
    });

    it('submits AAS endpoint Name: "My endpoint", URL: "file:///a\\b\\my-endpoint"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.selectItem(component.items()[3]);
        component.name.set('My endpoint');
        component.selectedItem().value = 'file:///a\\b\\my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('My endpoint');
        expect(endpoint?.url).toEqual('file:///a/b/my-endpoint');
        expect(endpoint?.type).toEqual('FileSystem');
    });

    it('ignores AAS endpoint: Name: "", URL: "file:///my-endpoint"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        spyOn(modal, 'close');

        component.selectItem(component.items()[3]);
        component.name.set('');
        component.selectedItem().value = 'file:///my-endpoint';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('ignores AAS endpoint Name: "My endpoint", URL: "file:///"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        spyOn(modal, 'close');

        component.selectItem(component.items()[3]);
        component.name.set('My endpoint');
        component.selectedItem().value = 'file:///';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('submits AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://localhost:30001/I4AASServer"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.selectItem(component.items()[1]);
        component.name.set('I4AAS Server');
        component.selectedItem().value = 'opc.tcp://localhost:30001/I4AASServer';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('I4AAS Server');
        expect(endpoint?.url).toEqual('opc.tcp://localhost:30001/I4AASServer');
        expect(endpoint?.type).toEqual('OPC_UA');
    });

    it('ignores AAS endpoint Name: "I4AAS Server", URL: "opc.tcp://"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        spyOn(modal, 'close');

        component.selectItem(component.items()[1]);
        component.name.set('I4AAS Server');
        component.selectedItem().value = 'opc.tcp://';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });

    it('submits AASX server Name: "AASX Server", URL: "http://localhost:50001/"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.selectItem(component.items()[0]);
        component.name.set('AASX Server');
        component.selectedItem().value = 'http://localhost:50001/';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('AASX Server');
        expect(endpoint?.url).toEqual('http://localhost:50001/');
        expect(endpoint?.type).toEqual('AAS_API');
    });

    it('submits WebDAV server Name: "WebDAV", URL: "http://localhost:8080/root/folder"', () => {
        const fixture = TestBed.createComponent(AddEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        let endpoint: AASEndpoint | undefined;
        spyOn(modal, 'close').and.callFake(result => (endpoint = result));

        component.selectItem(component.items()[2]);
        component.name.set('WebDAV Server');
        component.selectedItem().value = 'http://localhost:8080/root/folder';

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
        expect(endpoint?.name).toEqual('WebDAV Server');
        expect(endpoint?.url).toEqual('http://localhost:8080/root/folder');
        expect(endpoint?.type).toEqual('WebDAV');
    });
});
