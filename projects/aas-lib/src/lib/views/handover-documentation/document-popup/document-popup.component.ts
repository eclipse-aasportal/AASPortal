/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DocumentationItem } from '../handover-documentation.state';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-document-popup',
    imports: [TranslateDirective],
    templateUrl: './document-popup.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './document-popup.component.scss',
})
export class DocumentPopupComponent {
    @Input() public title: string = '';
    @Input() public body: DocumentationItem = {
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
    @Input() public modalId: string = 'customModal';

    public constructor(
        translate: TranslateService,
        public activeModal: NgbActiveModal,
    ) {}

    public closeModal(): void {
        this.activeModal.dismiss();
    }

    public getTitle(): string {
        if (this.body.title) return this.body.title;

        if (!this.body.files || this.body.files.length <= 0) return 'N/A';

        return this.body.files[0].name;
    }

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

    public openFile(): void {
        if (!this.body) return;
        if (!this.body.files || this.body.files.length <= 0) return;

        window.open(this.body.files[0].url, '_blank');
    }
}
