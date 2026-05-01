/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import upperFirst from 'lodash-es/upperFirst';
import { ChangeDetectionStrategy, Component, computed, input, signal, WritableSignal } from '@angular/core';
import { aas, isReference } from 'aas-core';
import { isLangString, referenceToString } from '../../utilities';

export interface NameValue {
    name: string;
    value: string[];
}

export interface DataSpecification {
    id: string;
    idShort: string;
    specifications: NameValue[][];
}

export interface ConceptDescriptionItem extends DataSpecification {
    collapsed: WritableSignal<boolean>;
}

export interface ConceptDescriptionsData {
    items: ConceptDescriptionItem[];
}

@Component({
    selector: 'fhg-cd',
    templateUrl: './concept-description.component.html',
    styleUrl: './concept-description.component.scss',
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptDescriptionComponent {
    public readonly conceptDescription = input<aas.ConceptDescription>();

    public readonly item = computed(() => {
        const conceptDescription = this.conceptDescription();
        if (!conceptDescription) {
            return {
                id: '',
                idShort: '',
                collapsed: signal(true),
                specifications: [],
            } satisfies ConceptDescriptionItem;
        }

        return {
            id: conceptDescription.id,
            idShort: conceptDescription.idShort,
            collapsed: signal(true),
            specifications: this.getEmbeddedDataSpecifications(conceptDescription.embeddedDataSpecifications),
        } satisfies ConceptDescriptionItem;
    });

    private getEmbeddedDataSpecifications(
        embeddedDataSpecifications: aas.EmbeddedDataSpecification[] | undefined,
    ): NameValue[][] {
        if (embeddedDataSpecifications === undefined) {
            return [];
        }

        const items: NameValue[][] = [];
        for (const embeddedDataSpecification of embeddedDataSpecifications) {
            items.push(this.getEmbeddedDataSpecification(embeddedDataSpecification));
        }

        return items;
    }

    private getEmbeddedDataSpecification(embeddedDataSpecification: aas.EmbeddedDataSpecification): NameValue[] {
        const items: NameValue[] = [];

        if (embeddedDataSpecification.dataSpecification) {
            items.push({
                name: 'DataSpecification',
                value: [referenceToString(embeddedDataSpecification.dataSpecification)],
            });
        }

        const obj = embeddedDataSpecification.dataSpecificationContent as unknown as Record<string, unknown>;
        for (const name in obj) {
            const value = obj[name];
            if (typeof value === 'string') {
                items.push({ name: upperFirst(name), value: [value] });
            } else if (isLangString(value)) {
                items.push({ name: upperFirst(name), value: value.map(item => `[${item.language}] ${item.text}`) });
            } else if (isReference(value)) {
                items.push({ name: upperFirst(name), value: [referenceToString(value)] });
            }
        }

        return items;
    }
}
