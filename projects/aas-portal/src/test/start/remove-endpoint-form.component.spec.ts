/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { RemoveEndpointFormComponent } from '../../app/start/remove-endpoint-form/remove-endpoint-form.component';


describe('RemoveEndpointFormComponent', () => {
    let component: RemoveEndpointFormComponent;
    let fixture: ComponentFixture<RemoveEndpointFormComponent>;
    let submitButton: HTMLButtonElement;
    let modal: NgbActiveModal;
    let form: HTMLFormElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                RemoveEndpointFormComponent
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

        fixture = TestBed.createComponent(RemoveEndpointFormComponent);
        component = fixture.componentInstance;
        component.endpoints = [
            { name: 'Samples', url: 'http://localhost:1234', selected: false },
            { name: 'I4AAS Server', url: 'http://localhost:1235', selected: false },
            { name: 'AAS Registry', url: 'http://localhost:1236', selected: false }
        ];

        fixture.detectChanges();

        modal = TestBed.inject(NgbActiveModal);
        form = fixture.debugElement.nativeElement.querySelector('form');
        submitButton = fixture.debugElement.nativeElement.querySelector('button[type="submit"]');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('allows deleting the "Samples" registry', function () {
        spyOn(modal, 'close').and.callFake(result => {
            expect(result).toEqual(['Samples']);
        });

        const inputElement: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#inputSamples');
        inputElement.checked = true;
        inputElement.dispatchEvent(new Event('change'));
        // Hack
        component.endpoints[0].selected = true;

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
    });

    it('allows deleting the "Samples" registry', function () {
        spyOn(modal, 'close');
        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages.length > 0).toBeTrue();
    });
});