/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { PromptDialog } from './prompt-dialog';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('PromptDialog', () => {
    let component: PromptDialog;
    let fixture: ComponentFixture<PromptDialog>;
    let activeModal: Mocked<NgbActiveModal>;
    let modal: Mocked<NgbModal>;

    beforeEach(async () => {
        activeModal = createSpyObj<NgbActiveModal>(['close', 'dismiss']);
        modal = createSpyObj<NgbModal>(['open']);

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: activeModal,
                },
                {
                    provide: NgbModal,
                    useValue: modal,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [PromptDialog],
        }).compileComponents();

        fixture = TestBed.createComponent(PromptDialog);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should submit', () => {
        const event = new Event('submit');
        component.value().value.set('Hello World.');
        component.submit(event);
        expect(activeModal.close).toHaveBeenCalledWith('Hello World.');
    });

    it('should dismiss', () => {
        component.cancel();
        expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('opens the dialog', async () => {
        const promise = new Promise<string>(resolve => {
            activeModal.close.mockImplementation(value => resolve(value));
            component.value().value.set('Hello World!');
            component.submit(new Event('submit'));
        });

        modal.open.mockReturnValue({
            componentInstance: component,
            result: promise,
        } as NgbModalRef);

        const value = await PromptDialog.open(modal, 'Test');
        expect(modal.open).toHaveBeenCalled();
        expect(component.text()).toBe('Test');
        expect(value).toBe('Hello World!');
    });

    it('confirms a delete operation', async () => {
        const promise = new Promise<string>(resolve => {
            activeModal.close.mockImplementation(value => resolve(value));
            component.value().value.set('Delete');
            component.submit(new Event('submit'));
        });

        modal.open.mockReturnValue({
            componentInstance: component,
            result: promise,
        } as NgbModalRef);

        const value = await PromptDialog.confirm(modal, 'Enter "Delete" to delete.', 'Delete');
        expect(activeModal.close).toHaveBeenCalledWith('Delete');
        expect(component.text()).toBe('Enter "Delete" to delete.');
        expect(value).toBe('Delete');
    });
});
