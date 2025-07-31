/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Injectable, signal } from '@angular/core';
import { aas, AASDocument, getSemanticId } from 'aas-core';
import { CUSTOMER_FEEDBACK } from '../views';

export interface GeneralItem {
    name: string;
    score: number;
    sum: number;
    count: number;
    like: boolean;
}

export interface FeedbackItem {
    stars: string[];
    createdAt: string;
    subject: string;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerFeedbackStore {
    public readonly documents = signal<AASDocument[]>([]);

    public readonly submodels = computed(() => [...this.filterSubmodels(this.documents())]);

    private *filterSubmodels(documents: AASDocument[]): Generator<[aas.Environment, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId === CUSTOMER_FEEDBACK) {
                    yield [document.content, submodel];
                }
            }
        }
    }
}
