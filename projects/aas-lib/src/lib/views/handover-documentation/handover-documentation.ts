/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';

import {
    aas,
    AASDocument,
    getReferable,
    getSemanticId,
    isFile,
    isProperty,
    isSubmodelElementCollection,
    toDisplayValue,
} from 'aas-core';

import { HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0 } from '../views';
import { getUrl } from '../../utilities';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

export type DocumentationItem = {
    title: string;
    version: string;
    filename: string;
    url?: string;
};

@Component({
    selector: 'fhg-handover-documentation',
    imports: [TranslateModule, NgbAccordionModule],
    templateUrl: './handover-documentation.html',
    styleUrl: './handover-documentation.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentation {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(translate: TranslateService) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

    public readonly document = input<AASDocument>();

    public readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => {
            const semanticId = getSemanticId(submodel);
            return semanticId === HANDOVER_DOCUMENTATION_1_2 || semanticId === HANDOVER_DOCUMENTATION_2_0;
        });
    });

    public readonly semanticId = computed(() => {
        const submodel = this.submodel();
        if (!submodel) {
            return undefined;
        }

        return getSemanticId(submodel);
    });

    public readonly items = computed(() => {
        const semanticId = untracked(this.semanticId);
        const submodel = this.submodel();
        const document = this.document();
        this.currentLang();
        if (!document || !submodel) {
            return [];
        }

        return semanticId === HANDOVER_DOCUMENTATION_1_2
            ? this.createItemsV1Dot2(document, submodel)
            : this.createItemsV2Dot0(document, submodel);
    });

    private createItemsV1Dot2(document: AASDocument, submodel: aas.Submodel): DocumentationItem[] {
        const items: DocumentationItem[] = [];
        const documentId = '0173-1#02-ABI500#001/0173-1#01-AHF579#001*01';
        const documentVersionId = '0173-1#02-ABI503#001/0173-1#01-AHF582#001*01';
        const digitalFileId = '0173-1#02-ABI504#001/0173-1#01-AHF583#001';
        if (!submodel.submodelElements) {
            return items;
        }

        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && getSemanticId(sme) === documentId && sme.value) {
                for (const documentVersion of sme.value.filter(
                    element => getSemanticId(element) === documentVersionId,
                )) {
                    if (isSubmodelElementCollection(documentVersion) && documentVersion.value) {
                        // const previewFile = getReferable(documentVersion, 'PreviewFile');
                        const version = getReferable(documentVersion, 'DocumentVersionId');
                        const title = getReferable(documentVersion, 'Title');
                        const digitalFiles = documentVersion.value.filter(
                            element => getSemanticId(element) === digitalFileId,
                        );

                        if (digitalFiles.length) {
                            items.push({
                                title: this.toString(title),
                                version: this.toString(version),
                                filename: this.toString(digitalFiles[0]),
                                url: getUrl(document, submodel, digitalFiles[0] as aas.File),
                            });
                        }
                    }
                }
            }
        }

        return items;
    }

    private createItemsV2Dot0(document: AASDocument, submodel: aas.Submodel): DocumentationItem[] {
        const items: DocumentationItem[] = [];
        const documentId = '0173-1#02-ABI500#003/0173-1#01-AHF579#003*01';
        const documentVersionId = '0173-1#02-ABI503#003/0173-1#01-AHF582#003*01';
        const digitalFileId = '0173-1#02-ABI503#003/0173-1#01-AHF582#003*01';
        if (!submodel.submodelElements) {
            return items;
        }

        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && getSemanticId(sme) === documentId && sme.value) {
                for (const documentVersion of sme.value.filter(
                    element => getSemanticId(element) === documentVersionId,
                )) {
                    if (isSubmodelElementCollection(documentVersion) && documentVersion.value) {
                        // const previewFile = getReferable(documentVersion, 'PreviewFile');
                        const version = getReferable(documentVersion, 'DocumentVersionId');
                        const title = getReferable(documentVersion, 'Title');
                        const digitalFiles = documentVersion.value.filter(
                            element => getSemanticId(element) === digitalFileId,
                        );

                        if (digitalFiles.length) {
                            items.push({
                                title: this.toString(title),
                                version: this.toString(version),
                                filename: this.toString(digitalFiles[0]),
                                url: getUrl(document, submodel, digitalFiles[0] as aas.File),
                            });
                        }
                    }
                }
            }
        }

        return items;
    }

    private toString(referable: aas.Referable | undefined): string {
        if (!referable) {
            return '-';
        }

        if (isProperty(referable)) {
            return toDisplayValue(referable.value, referable.valueType, untracked(this.currentLang)) ?? '-';
        }

        if (isFile(referable)) {
            return referable.value ?? '-';
        }

        return '-';
    }
}
