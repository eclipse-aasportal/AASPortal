/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DocumentSubmodelPair } from 'aas-lib';

export interface ViewState {
    template?: string;
    submodels: DocumentSubmodelPair[];
}

export interface State {
    view: ViewState;
}
