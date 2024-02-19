/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'common';

export interface AASState {
    document: AASDocument | null;
    state: 'online' | 'offline';
    search: string;
    error: Error | null;
}

export const initialState: AASState = {
    document: null,
    search: '',
    state: 'offline',
    error: null,
};

export interface State {
    aas: AASState;
}
