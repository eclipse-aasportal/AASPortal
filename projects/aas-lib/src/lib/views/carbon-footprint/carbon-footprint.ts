/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangeDetectionStrategy, Component, computed, effect, input, untracked } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';

import { AASDocument } from 'aas-core';

import { DataSheet } from '../../components/data-sheet/data-sheet';
import { CarbonFootprintData, CarbonFootprintState } from './carbon-footprint.state';
import { ChildComponent } from '../../components/child-component';

/**
 * Provides a component for a submodel that belongs to the specification "Carbon Footprint".
 * Version 0.9 and 1.0 are supported.
 */
@Component({
    selector: 'fhg-carbon-footprint',
    templateUrl: './carbon-footprint.html',
    styleUrl: './carbon-footprint.scss',
    providers: [CarbonFootprintState],
    imports: [NgbAccordionModule, NgbPaginationModule, TranslateDirective, DataSheet],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprint extends ChildComponent<CarbonFootprintData, CarbonFootprintState> {
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

    /** The AAS document. */
    public readonly document = input<AASDocument>();

    /** Indicates whether the first carbon footprint item is collapsed. */
    public readonly collapsed = input(false);

    /** The state of the carbon footprint component. */
    public override readonly state = input.required<CarbonFootprintState>();

    /** The total product carbon footprint. */
    public readonly totalPcfCO2eq = computed(() => this.state().totalPcfCO2eq());

    /** The available product carbon footprint items. */
    public readonly items = computed(() => this.state().items());

    /** The current active carbon footprint item. */
    public readonly carbonFootprint = computed(() => {
        return this.state().items()[this.state().index() - 1];
    });

    /** The index of the current active carbon footprint item. */
    public readonly index = computed(() => this.state().index());

    /** The number of carbon footprint items. */
    public readonly count = computed(() => this.state().items().length);

    /**
     * Activates the carbon footprint with the specified index.
     * @param index The index of the carbon footprint to activate.
     */
    public setIndex(index: number): void {
        this.state().update({ index });
    }
}
