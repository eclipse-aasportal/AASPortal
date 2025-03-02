/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { AASDocument, getLocaleValue } from 'aas-core';
import { StartTileComponent } from '../../types';
import { SecuredImageComponent } from '../../secured-image/secured-image.component';
import { FavoriteApiService } from './favorite-api.service';
import { encodeBase64Url } from '../../utilities';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'fhg-favorite',
    templateUrl: './favorite.component.html',
    styleUrl: './favorite.component.scss',
    standalone: true,
    imports: [SecuredImageComponent],
    providers: [FavoriteApiService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteComponent implements StartTileComponent {
    private readonly document$ = signal<AASDocument | undefined>(undefined);
    private readonly aas$ = computed(() => this.document$()?.content?.assetAdministrationShells.at(0));

    public constructor(
        private readonly translate: TranslateService,
        private readonly api: FavoriteApiService,
    ) {
        effect(() => {
            const endpoint = this.endpoint();
            const id = this.id();
            if (endpoint && id) {
                this.getDocument(id, endpoint);
            }
        });
    }

    public readonly endpoint = input('');

    public readonly id = input('');

    public readonly idShort = computed(() => {
        return this.aas$()?.idShort ?? '-';
    });

    public readonly displayName = computed(() => {
        const displayName = this.aas$()?.displayName;
        if (displayName === undefined) {
            return undefined;
        }

        return getLocaleValue(displayName, this.translate.currentLang);
    });

    public readonly description = computed(() => {
        const description = this.aas$()?.description;
        if (description === undefined) {
            return undefined;
        }

        return getLocaleValue(description, this.translate.currentLang);
    });

    public readonly assetId = computed(() => this.aas$()?.assetInformation.globalAssetId ?? '-');

    public readonly thumbnail = computed(() => {
        const document = this.document$();
        if (document === undefined) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly href = computed(() => {
        const document = this.document$();
        if (document === undefined) {
            return 'javascript:void(0)';
        }

        return `/aas?endpoint=${encodeBase64Url(document.endpoint)}&id=${encodeBase64Url(document.id)}`;
    });

    public readonly version = computed(() => {
        const administration = this.aas$()?.administration;
        if (administration === undefined) {
            return '-';
        }

        if (administration.version && administration.revision) {
            return `${administration.version}.${administration.revision}`;
        }

        if (administration.version) {
            return administration.version;
        }

        if (administration.revision) {
            return `(${administration.revision})`;
        }

        return '-';
    });

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => this.document$.set(document),
            error: error => console.debug(error),
        });
    }
}
