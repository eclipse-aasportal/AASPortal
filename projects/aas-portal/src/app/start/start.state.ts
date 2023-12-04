/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ViewMode } from 'projects/aas-lib/src/public-api';
import { AASDocument } from 'common';

export interface StartState {
    viewMode: ViewMode;
    filter: string;
    limit: number;
    documents: AASDocument[];
}

export interface StartFeatureState {
    start: StartState;
}