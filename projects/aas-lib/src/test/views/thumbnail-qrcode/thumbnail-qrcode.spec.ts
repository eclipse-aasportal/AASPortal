/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component, input, provideZonelessChangeDetection } from '@angular/core';
import { ThumbnailQRCode } from '../../..//lib/views/thumbnail-qrcode/thumbnail-qrcode';
import { WINDOW, WindowService } from '../../../lib/services/window.service';
import { SecuredImageComponent } from '../../../lib/components/secured-image/secured-image.component';

import sample from '../../assets/dpp-sample.json';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestSecuredImageComponent {
    public readonly src = input<string>('');
    public readonly alt = input<string | undefined>();
    public readonly class = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

describe('ThumbnailQRCode', () => {
    let component: ThumbnailQRCode;
    let fixture: ComponentFixture<ThumbnailQRCode>;
    let window: jasmine.SpyObj<WindowService>;

    beforeEach(async () => {
        window = jasmine.createSpyObj<WindowService>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        await TestBed.configureTestingModule({
            imports: [ThumbnailQRCode],
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        TestBed.overrideComponent(ThumbnailQRCode, {
            remove: { imports: [SecuredImageComponent] },
            add: { imports: [TestSecuredImageComponent] },
        });

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
        expect(component.qrCode()).toBeTruthy();
    });
});
