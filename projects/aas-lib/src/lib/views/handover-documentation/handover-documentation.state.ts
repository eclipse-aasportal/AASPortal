/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASDocument,
    getLocaleValue,
    getReferable,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
    toDisplayValue,
} from 'aas-core';

import { ChildState } from '../../components/child-state';
import { basename, extension, findSubmodel, getUrl } from '../../utilities';
import { HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0 } from '../views-constants';

export type FileItem = {
    name: string;
    extension?: string;
    url: string | undefined;
};

export type DocumentationItem = {
    preview: string | undefined;
    title: string;
    subtitle: string;
    language: string;
    organization: string;
    summary: string;
    keywords: string;
    version: string;
    status: string;
    statusDate: string;
    files: FileItem[];
};

export type HandoverDocumentationData = {
    document: AASDocument | null;
    submodel: aas.Submodel | null;
    items: DocumentationItem[];
};

const initialState: HandoverDocumentationData = {
    document: null,
    submodel: null,
    items: [],
};

/**
 * Manages the state of the HandoverDocumentation component.
 */
@Injectable()
export class HandoverDocumentationState extends ChildState {
    private readonly document$ = signal(initialState.document);
    private readonly submodel$ = signal(initialState.submodel);
    private readonly items$ = signal(initialState.items);

    public constructor() {
        super(inject(TranslateService));

        effect(() => {
            const document = this.document$();
            if (!document) {
                return;
            }

            const submodel = findSubmodel(document, [HANDOVER_DOCUMENTATION_1_2, HANDOVER_DOCUMENTATION_2_0]);
            if (!submodel) {
                return;
            }

            this.update({ submodel, items: this.createItems(submodel) });
        });

        effect(() => {
            this.currentLang();
            const submodel = untracked(this.submodel$);
            if (!submodel) {
                return;
            }

            this.update({ items: this.createItems(submodel) });
        });
    }

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** The current active submodel. */
    public readonly submodel = this.submodel$.asReadonly();

    /** The handover document items. */
    public readonly items = this.items$.asReadonly();

    public update(newState: Partial<HandoverDocumentationData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.submodel !== undefined) {
            this.submodel$.set(newState.submodel);
        }

        if (newState.items !== undefined) {
            this.items$.set(newState.items);
        }
    }

    private createItems(submodel: aas.Submodel): DocumentationItem[] {
        const semanticId = getSemanticId(submodel);
        return semanticId === HANDOVER_DOCUMENTATION_1_2
            ? this.createItemsV1Dot2(submodel)
            : this.createItemsV2Dot0(submodel);
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
                            title: this.toExpression(getReferable(documentVersion, 'Title'), ''),
                            subtitle: this.toExpression(getReferable(documentVersion, 'SubTitle'), ''),
                            summary: this.toExpression(getReferable(documentVersion, 'Summary'), ''),
                            organization: this.toExpression(
                                getReferable(documentVersion, 'OrganizationOfficialName'),
                                '',
                            ),
                            language: this.toExpression(getReferable(documentVersion, 'Language'), ''),
                            keywords: this.toExpression(getReferable(documentVersion, 'KeyWords'), ''),
                            version: this.toExpression(getReferable(documentVersion, 'DocumentVersionId')),
                            status: this.toExpression(getReferable(documentVersion, 'StatusValue')),
                            statusDate: this.toExpression(getReferable(documentVersion, 'StatusSetDate')),
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
        //Unfortunately the IDTA have wrong semIds in their template
        //Expecting people not to notice, I am adding those wrong semanticIds as alternatives
        const documentId = '0173-1#02-ABI500#003/0173-1#01-AHF579#003*01';
        const altDocumentId = '0173-1#02-ABI500#003';
        const documentVersionId = '0173-1#02-ABI503#003/0173-1#01-AHF582#003*01';
        const altDocumentVersionId = '0173-1#02-ABI503#003';
        if (!submodel.submodelElements) {
            return items;
        }
        for (const documents of submodel.submodelElements) {
            if (
                isSubmodelElementList(documents) &&
                (getSemanticId(documents) === documentId || getSemanticId(documents) === altDocumentId) &&
                documents.value
            ) {
                for (const document of documents.value) {
                    if (isSubmodelElementCollection(document) && document.value) {
                        for (const documentVersions of document.value.filter(
                            element =>
                                getSemanticId(element) === documentVersionId ||
                                getSemanticId(element) === altDocumentVersionId,
                        )) {
                            if (isSubmodelElementList(documentVersions) && documentVersions.value) {
                                //Version 2.0 supports multiple Versions for a single Document
                                //Add every Version separately
                                for (const documentVersion of documentVersions.value) {
                                    const item: DocumentationItem = {
                                        preview: this.getPreview(getReferable(documentVersion, 'PreviewFile')),
                                        title: this.toExpression(getReferable(documentVersion, 'Title'), ''),
                                        subtitle: this.toExpression(getReferable(documentVersion, 'SubTitle'), ''),
                                        organization: this.toExpression(
                                            getReferable(documentVersion, 'OrganizationOfficialName'),
                                            '',
                                        ),
                                        language: this.toExpression(getReferable(documentVersion, 'Language'), ''),
                                        summary: this.toExpression(getReferable(documentVersion, 'Description'), ''),
                                        keywords: this.toExpression(getReferable(documentVersion, 'KeyWords'), ''),
                                        version: this.toExpression(getReferable(documentVersion, 'DocumentVersionId')),
                                        status: this.toExpression(getReferable(documentVersion, 'StatusValue')),
                                        statusDate: this.toExpression(getReferable(documentVersion, 'StatusSetDate')),
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
                }
            }
        }

        return items;
    }

    private toExpression(referable: aas.Referable | undefined, defaultValue: string = '-'): string {
        if (!referable) {
            return defaultValue;
        }

        if (isProperty(referable)) {
            return toDisplayValue(referable.value, referable.valueType, this.currentLang()) ?? '-';
        }

        if (isMultiLanguageProperty(referable)) {
            return getLocaleValue(referable.value, this.currentLang()) ?? '-';
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
