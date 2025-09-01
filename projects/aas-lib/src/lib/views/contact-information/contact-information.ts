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
import { ContactInformationData, ContactInformationState } from './contact-information.state';
import { ChildComponent } from '../../components/child-component';

@Component({
    selector: 'fhg-contact-information',
    providers: [ContactInformationState],
    imports: [NgbAccordionModule],
    templateUrl: './contact-information.html',
    styleUrl: './contact-information.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformation extends ChildComponent<ContactInformationData, ContactInformationState> {
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

    public override readonly state = input.required<ContactInformationState>();

    public readonly document = input<AASDocument>();

    public readonly contacts = computed(() => this.state().contacts());
}
