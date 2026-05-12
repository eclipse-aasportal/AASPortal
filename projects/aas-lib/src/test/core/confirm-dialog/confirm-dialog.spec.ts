/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { ConfirmDialog } from '../../../lib/core/confirm-dialog/confirm-dialog';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { createSpyObj, FakeLoader } from '../../mocks';

describe('ConfirmDialog', () => {
    let component: ConfirmDialog;
    let fixture: ComponentFixture<ConfirmDialog>;
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
            imports: [ConfirmDialog],
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDialog);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close with true', () => {
        component.close(true);
        expect(activeModal.close).toHaveBeenCalledWith(true);
    });

    it('should close with false', () => {
        component.close(false);
        expect(activeModal.close).toHaveBeenCalledWith(false);
    });

    it('should cancel', () => {
        component.cancel();
        expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('opens the dialog', async () => {
        modal.open.mockReturnValue({
            componentInstance: { text: signal(''), cancelable: signal(false) },
            result: Promise.resolve(true),
        } as NgbModalRef);

        const result = await ConfirmDialog.open(modal, 'Test text', true);
        expect(modal.open).toHaveBeenCalled();
        expect(result).toBe(true);
    });
});
