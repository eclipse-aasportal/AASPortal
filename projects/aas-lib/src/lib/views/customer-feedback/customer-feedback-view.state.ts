/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { LeafViewData, LeafViewState } from '../leaf-view-state';
import { FeedbackItem, GeneralItem } from './customer-feedback.types';

export interface CustomerFeedbackViewData extends LeafViewData {
    stars: number;
    count: number;
    items: GeneralItem[];
    feedbacks: FeedbackItem[];
    starClassNames: string[];
}

const initialState: CustomerFeedbackViewData = {
    tuples: [],
    stars: 0,
    count: 0,
    items: [],
    feedbacks: [],
    starClassNames: [],
};

@Injectable({
    providedIn: 'root',
})
export class CustomerFeedbackViewState extends LeafViewState<CustomerFeedbackViewData> {
    private readonly stars$ = signal(0.0);
    private readonly count$ = signal(0);
    private readonly items$ = signal<GeneralItem[]>([]);
    private readonly feedbacks$ = signal<FeedbackItem[]>([]);
    private readonly starClassNames$ = signal<string[]>([]);

    public readonly stars = this.stars$.asReadonly();
    public readonly count = this.count$.asReadonly();
    public readonly items = this.items$.asReadonly();
    public readonly feedbacks = this.feedbacks$.asReadonly();
    public readonly starClassNames = this.starClassNames$.asReadonly();

    public constructor() {
        super(initialState);
    }

    protected override updating(newState: Partial<CustomerFeedbackViewData>): void {
        if (newState.stars !== undefined) {
            this.stars$.set(newState.stars);
        }

        if (newState.count !== undefined) {
            this.count$.set(newState.count);
        }

        if (newState.items !== undefined) {
            this.items$.set(newState.items);
        }

        if (newState.feedbacks !== undefined) {
            this.feedbacks$.set(newState.feedbacks);
        }

        if (newState.stars !== undefined) {
            this.stars$.set(newState.stars);
        }

        if (newState.starClassNames !== undefined) {
            this.starClassNames$.set(newState.starClassNames);
        }
    }
}
