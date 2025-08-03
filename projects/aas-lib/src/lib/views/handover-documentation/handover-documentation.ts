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
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import {
    aas,
    AASDocument,
    getReferable,
    getSemanticId,
    isFile,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
    toDisplayValue,
} from 'aas-core';

import { HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0 } from '../../internal';
import { basename, extension, getUrl } from '../../utilities';

export type FileItem = {
    name: string;
    extension?: string;
    url: string | undefined;
};

export type DocumentationItem = {
    preview: string | undefined;
    title: string;
    version: string;
    status: string;
    files: FileItem[];
};

/**
 * Provides a specific view for a handover documentation submodel.
 */
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

    /** The current active AAS document. */
    public readonly document = input<AASDocument>();

    /** Indicates the accordion item is collapsed or expanded. */
    public readonly collapsed = input(false);

    /** The handover documentation submodel. */
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

    /** The semantic identifier of the submodel. */
    public readonly semanticId = computed(() => {
        const submodel = this.submodel();
        if (!submodel) {
            return undefined;
        }

        return getSemanticId(submodel);
    });

    /** The document items. */
    public readonly items = computed(() => {
        const semanticId = untracked(this.semanticId);
        const submodel = this.submodel();
        this.currentLang();
        if (!submodel) {
            return [];
        }

        return semanticId === HANDOVER_DOCUMENTATION_1_2
            ? this.createItemsV1Dot2(submodel)
            : this.createItemsV2Dot0(submodel);
    });

    /**
     * Gets an URL to a preview image for the specified document.
     * @param item The current document item.
     * @returns An URL.
     **/
    public getPreviewSource(item: DocumentationItem): string {
        if (item.preview) {
            return item.preview;
        }

        switch (item.files.at(0)?.extension?.toLowerCase()) {
            case '.pdf':
                return '/assets/resources/file-earmark-pdf.svg';
            case '.doc':
            case '.docx':
                return '/assets/resources/file-earmark-word.svg';
            case '.xls':
            case '.xlsx':
                return '/assets/resources/file-earmark-excel.svg';
            default:
                return '/assets/resources/file-earmark.svg';
        }
    }

    private createItemsV1Dot2(submodel: aas.Submodel): DocumentationItem[] {
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
                        const item: DocumentationItem = {
                            preview: this.getPreview(getReferable(documentVersion, 'PreviewFile')),
                            title: this.toString(getReferable(documentVersion, 'Title'), ''),
                            version: this.toString(getReferable(documentVersion, 'DocumentVersionId')),
                            status: this.toString(getReferable(documentVersion, 'StatusValue')),
                            files: [],
                        };

                        for (const digitalFile of documentVersion.value.filter(
                            element => getSemanticId(element) === digitalFileId,
                        )) {
                            if (isFile(digitalFile)) {
                                item.files.push(this.createFileItem(digitalFile));
                            }
                        }

                        if (item.files.length) {
                            items.push(item);
                        }
                    }
                }
            }
        }

        return items;
    }

    private createItemsV2Dot0(submodel: aas.Submodel): DocumentationItem[] {
        const items: DocumentationItem[] = [];
        const documentId = '0173-1#02-ABI500#003/0173-1#01-AHF579#003*01';
        const documentVersionId = '0173-1#02-ABI503#003/0173-1#01-AHF582#003*01';
        if (!submodel.submodelElements) {
            return items;
        }

        for (const documents of submodel.submodelElements) {
            if (isSubmodelElementList(documents) && getSemanticId(documents) === documentId && documents.value) {
                for (const documentVersion of documents.value.filter(
                    element => getSemanticId(element) === documentVersionId,
                )) {
                    if (isSubmodelElementCollection(documentVersion) && documentVersion.value) {
                        const item: DocumentationItem = {
                            preview: this.getPreview(getReferable(documentVersion, 'PreviewFile')),
                            title: this.toString(getReferable(documentVersion, 'Title')),
                            version: this.toString(getReferable(documentVersion, 'DocumentVersionId')),
                            status: this.toString(getReferable(documentVersion, 'StatusValue')),
                            files: [],
                        };

                        const digitalFiles = getReferable(documentVersion, 'DigitalFiles');
                        if (isSubmodelElementList(digitalFiles) && digitalFiles.value) {
                            for (const digitalFile of digitalFiles.value) {
                                if (isFile(digitalFile) && digitalFile.value) {
                                    item.files.push(this.createFileItem(digitalFile));
                                }
                            }
                        }

                        if (item.files.length) {
                            items.push(item);
                        }
                    }
                }
            }
        }

        return items;
    }

    private toString(referable: aas.Referable | undefined, defaultValue: string = '-'): string {
        if (!referable) {
            return defaultValue;
        }

        if (isProperty(referable)) {
            return toDisplayValue(referable.value, referable.valueType, untracked(this.currentLang)) ?? '-';
        }

        if (isFile(referable)) {
            if (referable.value) {
                return basename(referable.value);
            }
        }

        return defaultValue;
    }

    private createFileItem(digitalFile: aas.File): FileItem {
        return {
            name: basename(digitalFile.value!),
            extension: extension(digitalFile.value!),
            url: getUrl(this.document()!, digitalFile),
        };
    }

    private getPreview(referable: aas.Referable | undefined): string | undefined {
        if (isFile(referable) && referable.value) {
            return getUrl(this.document()!, referable);
        }

        return undefined;
    }
}
