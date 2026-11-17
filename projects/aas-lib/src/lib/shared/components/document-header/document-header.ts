/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    Component,
    computed,
    effect,
    ElementRef,
    inject,
    InjectionToken,
    input,
    linkedSignal,
    viewChild,
} from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';
import QRCode from 'qrcode';
import { aas, AASDocument } from 'aas-core';
import { encodeBase64Url } from '../../../utilities';
import { WINDOW } from '../../services/window.service';

export const QR_CODE = new InjectionToken<typeof QRCode>('Draw QR code', { factory: (): typeof QRCode => QRCode });

@Component({
    imports: [TranslateDirective],
    selector: 'fhg-doc-header',
    styleUrl: './document-header.scss',
    templateUrl: './document-header.html',
})
export class DocumentHeader {
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

    /** The canvas element that displays the QR code. */
    public readonly qrCodeContainer = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly document = input<AASDocument | null>();

    public readonly idShort = computed(() => this.document()?.idShort ?? '');

    public readonly id = computed(() => this.document()?.id ?? '');

    public readonly assetId = computed(() => this.document()?.assetId ?? '');

    public readonly thumbnail = linkedSignal(() => {
        const document = this.document();
        if (!document) {
            return '/assets/resources/aas-idta.png';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly version = computed(() =>
        this.versionToString(this.document()?.content?.assetAdministrationShells?.at(0)?.administration),
    );

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
