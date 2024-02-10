/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import * as CustomerFeedbackActions from './customer-feedback.actions';
import { CustomerFeedbackState, FeedbackItem, GeneralItem } from './customer-feedback.state';

const initialState: CustomerFeedbackState = {
    stars: 0.0,
    count: 0,
    starClassNames: [],
    items: [],
    feedbacks: [],
    error: null,
};

export const customerFeedbackReducer = createReducer(
    initialState,
    on(CustomerFeedbackActions.initialize, (state, { stars, count, starClassNames, items, feedbacks }) =>
        initialize(state, stars, count, starClassNames, items, feedbacks),
    ),
);

function initialize(
    state: CustomerFeedbackState,
    stars: number,
    count: number,
    starClassNames: string[],
    items: GeneralItem[],
    feedbacks: FeedbackItem[],
): CustomerFeedbackState {
    return {
        ...state,
        stars: stars,
        count: count,
        starClassNames: starClassNames,
        items: items,
        feedbacks: feedbacks,
        error: null,
    };
}
