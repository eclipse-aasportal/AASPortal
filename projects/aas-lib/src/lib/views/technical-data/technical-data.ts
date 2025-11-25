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

import { DataSheet } from '../../components/data-sheet/data-sheet';
import { ChildComponent } from '../../components/child-component';
import { TechnicalDataState } from './technical-data.state';

/**
 * TechnicalData component for displaying technical data sheets based on the
 * IDTA submodel template "Generic Frame for Technical Data for Industrial Equipment in Manufacturing".
 *
 * This component manages the rendering and state synchronization of technical data
 * from an AASDocument, including product classifications, technical properties,
 * general and further information. It reacts to document changes and updates the
 * displayed data sheets accordingly.
 */
@Component({
    selector: 'fhg-technical-data',
    imports: [NgbAccordionModule, DataSheet],
    templateUrl: './technical-data.html',
    styleUrl: './technical-data.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalData extends ChildComponent<TechnicalDataState> {
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
     * State manager for technical data, required input.
     */
    public override state = input.required<TechnicalDataState>();

    /**
     * Input for the current AASDocument.
     */
    public readonly document = input<AASDocument>();

    /**
     * Computed list of technical data sheets for rendering.
     */
    public readonly dataSheets = computed(() => this.state().dataSheets());
}
