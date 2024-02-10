/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { CustomerFeedbackFeatureState } from './customer-feedback.state';

const getCustomerFeedback = (state: CustomerFeedbackFeatureState) => state.customerFeedback;

export const selectCustomerFeedback = createSelector(getCustomerFeedback, customerFeedback => customerFeedback);
