/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, input, untracked } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { AASDocument } from 'aas-core';

import { ChildComponent } from '../../components/child-component';
import {
    DocumentationItem,
    HandoverDocumentationData,
    HandoverDocumentationState,
} from './handover-documentation.state';

/**
 * Provides a component for submodels that belong to the IDTA specification "Handover Documentation".
 * Version 1.2 and 2.0 are supported.
 */
@Component({
    selector: 'fhg-handover-documentation',
    imports: [TranslateDirective, NgbAccordionModule],
    templateUrl: './handover-documentation.html',
    styleUrl: './handover-documentation.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentation extends ChildComponent<HandoverDocumentationData, HandoverDocumentationState> {
    public constructor() {
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

    /**
     * The state of the handover documentation component.
     */
    public override state = input.required<HandoverDocumentationState>();

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
}
