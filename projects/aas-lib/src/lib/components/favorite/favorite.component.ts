/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, effect, input, signal } from '@angular/core';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, getLocaleValue } from 'aas-core';
import { encodeBase64Url } from '../../utilities';
import { EndpointsApi } from '../../shared/services/endpoints-api';

export type FavoriteDetail = {
    name: string;
    value: string;
};

@Component({
    selector: 'fhg-favorite',
    templateUrl: './favorite.component.html',
    styleUrl: './favorite.component.scss',
    imports: [TranslateDirective, TranslatePipe],
})
export class FavoriteComponent {
    private readonly document$ = signal<AASDocument | undefined>(undefined);
    private readonly aas$ = computed(() => this.document$()?.content?.assetAdministrationShells?.at(0));
    private readonly detailItems$ = signal<FavoriteDetail[]>([]);
    private readonly noteItems$ = signal<string[]>([]);

    public constructor(
        private readonly translate: TranslateService,
        private readonly api: EndpointsApi,
    ) {
        effect(() => {
            const endpoint = this.endpoint();
            const id = this.id();
            if (endpoint && id) {
                this.getDocument(id, endpoint);
            }
        });

        effect(() => {
            const details = this.details();
            if (!details || details.length === 0) {
                const document = this.document$();
                if (document === undefined) {
                    return;
                }

                this.detailItems$.set(this.getFavoriteDetails(document));
            } else {
                this.detailItems$.set(details);
            }
        });

        effect(() => {
            const notes = this.notes();
            if (!notes || notes.length === 0) {
                const document = this.document$();
                if (document === undefined) {
                    return;
                }

                this.noteItems$.set(this.getFavoriteNotes(document));
            } else {
                this.noteItems$.set(notes);
            }
        });
    }

    private readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');

    public readonly endpoint = input('');

    public readonly id = input('');

    public readonly details = input<FavoriteDetail[]>([]);

    public readonly notes = input<string[]>([]);

    public readonly href = input('');

    public readonly caption = computed(() => {
        const aas = this.aas$();
        if (aas === undefined) {
            return '';
        }

        const displayName = aas.displayName;
        if (displayName === undefined) {
            return aas.idShort;
        }

        return getLocaleValue(displayName, this.currentLang()) ?? aas.idShort;
    });

    public readonly thumbnail = computed(() => {
        const document = this.document$();
        if (document === undefined) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly detailItems = this.detailItems$.asReadonly();

    public readonly noteItems = this.noteItems$.asReadonly();

    private versionToString(administration: aas.AdministrativeInformation | undefined): string | undefined {
        if (administration === undefined) {
            return undefined;
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

        return undefined;
    }

    private getFavoriteDetails(document: AASDocument): FavoriteDetail[] {
        const details: FavoriteDetail[] = [];
        const aas = document.content?.assetAdministrationShells?.at(0);
        if (aas === undefined) {
            return details;
        }

        details.push({ name: 'Favorite.ENDPOINT', value: document.endpoint });
        const displayName = getLocaleValue(aas.displayName, this.currentLang());
        if (displayName) {
            details.push({
                name: 'Favorite.DISPLAY_NAME',
                value: displayName,
            });
        }

        details.push({ name: 'Favorite.ID_SHORT', value: aas.idShort });
        const version = this.versionToString(aas.administration);
        if (version) {
            details.push({ name: 'Favorite.VERSION', value: version });
        }

        details.push({ name: 'Favorite.SUBMODEL_COUNT', value: String(aas.submodels?.length ?? 0) });

        return details;
    }

    private getFavoriteNotes(document: AASDocument): string[] {
        const notes: string[] = [];

        const aas = document.content?.assetAdministrationShells?.at(0);
        if (aas === undefined) {
            return notes;
        }

        const description = getLocaleValue(aas.description, this.currentLang());
        if (description) {
            notes.push(description);
        }

        return notes;
    }

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument('AssetAdministrationShell', id, endpoint).subscribe({
            next: document => this.document$.set(document),
            error: error => console.debug(error),
        });
    }
}
