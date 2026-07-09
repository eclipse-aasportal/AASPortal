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
import { provideZonelessChangeDetection, signal } from '@angular/core';
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
        component.text().value.set('Hello World.');
        component.submit(event);
        expect(activeModal.close).toHaveBeenCalledWith('Hello World.');
    });

    it('should dismiss', () => {
        component.cancel();
        expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('opens the dialog', async () => {
        modal.open.mockReturnValue({
            componentInstance: { label: signal('') },
            result: Promise.resolve('Hello World!'),
        } as NgbModalRef);

        const text = await PromptDialog.open(modal, 'Test label');
        expect(modal.open).toHaveBeenCalled();
        expect(text).toBe('Hello World!');
    });
});
