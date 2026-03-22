/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { RemoveEndpointFormComponent } from '../../app/shells/remove-endpoint-form/remove-endpoint-form.component';
import { FakeLoader } from '../mocks';

describe('RemoveEndpointFormComponent', () => {
    let modal: NgbActiveModal;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                NgbActiveModal,
                provideZonelessChangeDetection(),
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [RemoveEndpointFormComponent],
        }).compileComponents();

        modal = TestBed.inject(NgbActiveModal);
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(RemoveEndpointFormComponent);
        const component = fixture.componentInstance;
        component.endpoints.set([
            { name: 'Samples', url: 'http://localhost:1234', selected: false },
            { name: 'I4AAS Server', url: 'http://localhost:1235', selected: false },
            { name: 'AAS Registry', url: 'http://localhost:1236', selected: false },
        ]);

        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('allows deleting the "Samples" registry', () => {
        const fixture = TestBed.createComponent(RemoveEndpointFormComponent);
        const component = fixture.componentInstance;
        component.endpoints.set([
            { name: 'Samples', url: 'http://localhost:1234', selected: false },
            { name: 'I4AAS Server', url: 'http://localhost:1235', selected: false },
            { name: 'AAS Registry', url: 'http://localhost:1236', selected: false },
        ]);

        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        vi.spyOn(modal, 'close').mockImplementation(result => {
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
        const fixture = TestBed.createComponent(RemoveEndpointFormComponent);
        const component = fixture.componentInstance;
        component.endpoints.set([
            { name: 'Samples', url: 'http://localhost:1234', selected: false },
            { name: 'I4AAS Server', url: 'http://localhost:1235', selected: false },
            { name: 'AAS Registry', url: 'http://localhost:1236', selected: false },
        ]);

        fixture.detectChanges();
        const form = fixture.debugElement.nativeElement.querySelector('form');
        vi.spyOn(modal, 'close');
        form.dispatchEvent(new Event('submit'));
        expect(modal.close).toHaveBeenCalledTimes(0);
        expect(component.messages().length > 0).toBe(true);
    });
});