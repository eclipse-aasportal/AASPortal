/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

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

export interface CustomerFeedbackState {
    stars: number;
    count: number;
    starClassNames: string[];
    items: GeneralItem[];
    feedbacks: FeedbackItem[];
    error: unknown
}

export interface CustomerFeedbackFeatureState {
    customerFeedback: CustomerFeedbackState;
}
