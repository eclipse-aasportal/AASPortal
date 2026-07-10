/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LangChangeEvent, TranslateDirective, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    OnDestroy,
    Signal,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { aas, AASDocument, getReferable } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { encodeBase64Url, getDisplayName, getDisplayValue } from '../../utilities';
import { StartService } from '../../services/start.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { Nameplate } from './nameplate';
import { LeafView } from '../leaf-view';
import { NameplateViewState } from './nameplate-view.state';
import { VIEW_ROUTE_NAME } from '../view-route-name';

/**
 * Provides a view for submodels that belong to the IDTA specification "Digital Nameplate for industrial equipment".
 */
@Component({
    selector: 'fhg-nameplate-view',
    templateUrl: './nameplate-view.html',
    styleUrls: ['./nameplate-view.scss'],
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'Nameplate' }],
    imports: [TranslateDirective, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, Nameplate, RouterModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameplateView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly state = inject(NameplateViewState);

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    /**
     * A `TemplateRef` for the nameplate toolbar. It is used to set the toolbar content.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    /**
     * The state of the nameplate child component.
     */
    public readonly nameplateState = this.state.nameplateState;

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public getSemanticId(): string | undefined {
        if (!this.submodel()) return '';
        return this.submodel()?.semanticId?.keys[0].value;
    }

    /**
     * Adds the current handover documentation view to the start service as a favorite.
     * @returns An `Observable<void>` that completes when the nameplate is successfully added to the start service and saved.
     * Returns `EMPTY` if the nameplate is undefined or if adding to the start service fails.
     */
    public addToStart(): Observable<void> {
        const nameplate = this.submodel();
        const document = this.document();
        if (nameplate === undefined || document === undefined) {
            return of(void 0);
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const details = this.getFavoriteDetails(document, nameplate, [
            'ManufacturerName',
            'ManufacturerProductType',
            'ManufacturerProductFamily',
            'ProductArticleNumberOfManufacturer',
            'SerialNumber',
        ]);

        const notes = this.getFavoriteNotes(document, nameplate, ['ManufacturerProductDesignation']);
        const href = `/views/Nameplate;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `DNP#${endpoint}#${id}`, { endpoint, id, details, notes, href })) {
            return of(void 0);
        }

        return this.start.save();
    }

    private getFavoriteDetails(
        document: AASDocument,
        nameplate: aas.Submodel,
        idShortPaths: string[],
    ): { name: string; value: string }[] {
        const details: { name: string; value: string }[] = [];
        const currentLang = this.currentLang();
        for (const idShortPath of idShortPaths) {
            const submodelElement = getReferable(nameplate, idShortPath);
            if (!submodelElement) {
                continue;
            }

            const value = getDisplayValue(submodelElement, currentLang, document.content);
            if (value) {
                details.push({
                    name: getDisplayName(submodelElement, document.content, currentLang),
                    value,
                });
            }
        }

        return details;
    }

    private getFavoriteNotes(document: AASDocument, submodel: aas.Submodel, idShortPaths: string[]): string[] {
        const notes: string[] = [];
        const currentLang = this.currentLang();
        for (const idShortPath of idShortPaths) {
            const submodelElement = getReferable(submodel, idShortPath);
            if (!submodelElement) {
                continue;
            }

            const value = getDisplayValue(submodelElement, currentLang, document.content);
            if (value) {
                notes.push(value);
            }
        }

        return notes;
    }
}
