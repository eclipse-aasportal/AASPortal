/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked, vitest } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { QR_CODE, ThumbnailQRCode } from './thumbnail-qrcode';
import { WINDOW, WindowService } from '../../share/services/window.service';

import sample from '../../../test/assets/dpp-sample.json';
import { createSpyObj } from '../../../test/mocks';

describe('ThumbnailQRCode', () => {
    let component: ThumbnailQRCode;
    let fixture: ComponentFixture<ThumbnailQRCode>;
    let window: Mocked<WindowService>;

    beforeEach(async () => {
        window = createSpyObj<WindowService>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        await TestBed.configureTestingModule({
            imports: [ThumbnailQRCode],
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                {
                    provide: QR_CODE,
                    useValue: { toCanvas: vitest.fn() },
                },
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ThumbnailQRCode);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('document', sample);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a thumbnail', () => {
        expect(component.thumbnail()).toBeTruthy();
    });

    it('provides a QR code', () => {
        expect(component.qrCodeContainer()).toBeTruthy();
    });
});
