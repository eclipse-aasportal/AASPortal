/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DocumentSubmodelPair } from 'projects/aas-lib/src/public-api';

export interface ViewState {
    template?: string;
    submodels: DocumentSubmodelPair[];
}

export interface State {
    view: ViewState;
}