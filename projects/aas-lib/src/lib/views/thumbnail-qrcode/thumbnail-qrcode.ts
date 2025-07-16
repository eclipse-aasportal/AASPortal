/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    Inject,
    input,
    viewChild,
} from '@angular/core';
import QRCode from 'qrcode';
import { AASDocument } from 'aas-core';
import { WINDOW } from '../../services/window.service';
import { encodeBase64Url } from '../../utilities';
import { SecuredImageComponent } from '../../components/secured-image/secured-image.component';

/**
 * Displays a thumbnail of the current Asset Administration Shell
 * and a QR code containing the URL of the current page.
 */
@Component({
    selector: 'fhg-thumbnail-qrcode',
    imports: [SecuredImageComponent],
    templateUrl: './thumbnail-qrcode.html',
    styleUrl: './thumbnail-qrcode.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThumbnailQRCode {
    public constructor(@Inject(WINDOW) private readonly window: Window) {
        effect(() => {
            const qrCode = this.qrCode();
            const url = this.window.location.toString();
            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url);
            }
        });
    }

    /** The canvas element that displays the QR code. */
    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    /** The AAS document. */
    public readonly document = input<AASDocument>();

    /** The URL of the thumbnail. */
    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (document === undefined) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });
}
