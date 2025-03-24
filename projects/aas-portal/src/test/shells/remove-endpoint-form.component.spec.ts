/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { RemoveEndpointFormComponent } from '../../app/shells/remove-endpoint-form/remove-endpoint-form.component';

describe('RemoveEndpointFormComponent', () => {
    let component: RemoveEndpointFormComponent;
    let fixture: ComponentFixture<RemoveEndpointFormComponent>;
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

        fixture = TestBed.createComponent(RemoveEndpointFormComponent);
        component = fixture.componentInstance;
        component.endpoints.set([
            { name: 'Samples', url: 'http://localhost:1234', selected: false },
            { name: 'I4AAS Server', url: 'http://localhost:1235', selected: false },
            { name: 'AAS Registry', url: 'http://localhost:1236', selected: false },
        ]);

        fixture.detectChanges();

        modal = TestBed.inject(NgbActiveModal);
        form = fixture.debugElement.nativeElement.querySelector('form');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('allows deleting the "Samples" registry', () => {
        spyOn(modal, 'close').and.callFake(result => {
            expect(result).toEqual(['Samples']);
        });

        const inputElement: HTMLInputElement = fixture.debugElement.nativeElement.querySelector('#inputSamples');
        inputElement.checked = true;
        inputElement.dispatchEvent(new Event('change'));
        // Hack
        component.endpoints()[0].selected = true;

        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalled();
    });

    it('Display message if no element selected.', () => {
        spyOn(modal, 'close');
        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBeTrue();
    });
});