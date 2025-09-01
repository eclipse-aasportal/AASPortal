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
import { NameplateData, NameplateState } from './nameplate.state';
import { ChildComponent } from '../../components/child-component';

/**
 * Provides a component for a submodel that belongs to the specification "Digital Nameplate for industrial equipment".
 * Version 2.0 and 3.0 are supported.
 */
@Component({
    selector: 'fhg-nameplate',
    imports: [NgbAccordionModule, DataSheet],
    templateUrl: './nameplate.html',
    styleUrl: './nameplate.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nameplate extends ChildComponent<NameplateData, NameplateState> {
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

    /** The state handler. */
    public override state = input.required<NameplateState>();

    /** The active AAS document. */
    public readonly document = input<AASDocument>();

    /** The presentation of the nameplate. */
    public readonly dataSheets = computed(() => this.state().dataSheets());
}
