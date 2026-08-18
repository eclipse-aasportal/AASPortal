/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, effect, ElementRef, inject, InjectionToken, input, linkedSignal, viewChild } from '@angular/core';
import QRCode from 'qrcode';
import { aas, AASDocument } from 'aas-core';
import { WINDOW } from '../../shared/services/window.service';
import { encodeBase64Url } from '../../utilities';
import { TranslateDirective } from '@ngx-translate/core';

export const QR_CODE = new InjectionToken<typeof QRCode>('Draw QR code', { factory: (): typeof QRCode => QRCode });

/**
 * Displays a thumbnail of the current Asset Administration Shell
 * and a QR code containing the URL of the current page.
 */
@Component({
    selector: 'fhg-thumbnail-qrcode',
    templateUrl: './thumbnail-qrcode.html',
    styleUrl: './thumbnail-qrcode.scss',
    imports: [TranslateDirective]
})
export class ThumbnailQRCode {
    public constructor() {
        const window = inject(WINDOW);
        const qrCode = inject(QR_CODE);

        effect(() => {
            const canvas = this.qrCodeContainer();
            const url = window.location.toString();
            if (canvas) {
                qrCode.toCanvas(canvas.nativeElement, url);
            }
        });
    }

    public readonly idShort = computed(() => this.document()?.idShort ?? '-');

    public readonly id = computed(() => this.document()?.id ?? '-');

    public readonly assetId = computed(() => this.document()?.assetId ?? '-');
    
    public readonly version = computed(() =>
        this.versionToString(this.document()?.content?.assetAdministrationShells?.at(0)?.administration),
    );
    /** The canvas element that displays the QR code. */
    public readonly qrCodeContainer = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    /** The AAS document. */
    public readonly document = input<AASDocument>();

    /** The URL of the thumbnail. */
    public readonly thumbnail = linkedSignal(() => {
        const document = this.document();
        if (!document) {
            return '/assets/resources/aas-idta.png';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    private versionToString(administration?: aas.AdministrativeInformation): string {
        let version: string = administration?.version ?? '';
        const revision: string = administration?.revision ?? '';
        if (revision.length > 0) {
            if (version.length > 0) {
                version += ' (' + revision + ')';
            } else {
                version = revision;
            }
        }

        if (version.length === 0) {
            version = '-';
        }

        return version;
    }
}
