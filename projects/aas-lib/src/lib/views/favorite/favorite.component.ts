import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { StartTileComponent } from '../../types';
import { SecuredImageComponent } from '../../secured-image/secured-image.component';
import { AASDocument } from 'projects/aas-core/dist/types';
import { FavoriteApiService } from './favorite-api.service';

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

    public constructor(private readonly api: FavoriteApiService) {
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

    public readonly address = computed(() => this.document$()?.address ?? '-');

    public readonly idShort = computed(() => this.document$()?.idShort ?? '-');

    public readonly assetId = computed(() => this.document$()?.assetId ?? '-');

    public readonly thumbnail = computed(() => this.document$()?.thumbnail ?? '-');

    public readonly version = computed(() => {
        const administration = this.document$()?.content?.assetAdministrationShells?.at(0)?.administration;
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

    private getDocumentContent(document: AASDocument): void {
        this.api.getContent(document.id, document.endpoint).subscribe({
            next: content => this.document$.set({ ...document, content }),
            error: () => this.document$.set(document),
        });
    }

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => this.document$.set(document),
            error: error => console.debug(error),
        });
    }
}
