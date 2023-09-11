/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from "@ngrx/store";
import { FeedbackItem, GeneralItem } from "./customer-feedback.state";

export enum CustomerFeedbackActionType {
    INITIALIZE = '[CustomerFeedback] initialize'
}

export const initialize = createAction(
    CustomerFeedbackActionType.INITIALIZE,
    props<{
        stars: number;
        count: number;
        starClassNames: string[];
        items: GeneralItem[];
        feedbacks: FeedbackItem[]
    }>());
