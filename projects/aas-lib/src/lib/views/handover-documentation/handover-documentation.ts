import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, input, untracked } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { AASDocument } from 'aas-core';

import { ChildComponent } from '../../components/child-component';
import { DocumentationItem, HandoverDocumentationState } from './handover-documentation.state';
import { DocumentPopupComponent } from './document-popup/document-popup.component';

/**
 * Provides a component for submodels that belong to the IDTA specification "Handover Documentation".
 * Version 1.2 and 2.0 are supported.
 */
@Component({
    selector: 'fhg-handover-documentation',
    imports: [NgbAccordionModule],
    templateUrl: './handover-documentation.html',
    styleUrl: './handover-documentation.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentation extends ChildComponent {
    clickedItem: DocumentationItem = {
        preview: '',
        title: 'test',
        subtitle: '',
        summary: '',
        organization: '',
        language: '',
        keywords: '',
        version: '',
        status: '',
        statusDate: '',
        files: [],
    };

    public constructor(private modalService: NgbModal) {
        super();

        effect(() => {
            const document = this.document();
            if (!document) {
                return;
            }

            const value = untracked(this.state().document);
            if (value === null || document.endpoint !== value.endpoint || document.id !== value.id) {
                this.state().update({ document });
            }
        });
    }

    openModal(item: DocumentationItem) {
        const modalRef = this.modalService.open(DocumentPopupComponent, { size: 'md' });
        modalRef.componentInstance.body = item;
        modalRef.componentInstance.title = 'Document'; // optional
    }

    /**
     * The state of the handover documentation component.
     */
    public state = input.required<HandoverDocumentationState>();

    /**
     * The current active AAS document.
     */
    public readonly document = input<AASDocument>();

    /**
     * Indicates the accordion item is collapsed or expanded.
     */
    public readonly collapsed = input(false);

    /**
     * The document items.
     */
    public readonly items = computed(() => this.state().items());

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

    public getDocumentTitle(item: DocumentationItem): string {
        if (item.title) return item.title;

        if (!item.files || item.files.length <= 0) return 'N/A';

        return item.files[0].name;
    }

    public openFile(item: DocumentationItem) {
        if (!item) return;
        if (!item.files || item.files.length <= 0) return;

        window.open(item.files[0].url, '_blank');
    }
}
