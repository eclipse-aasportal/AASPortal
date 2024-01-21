/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export interface MessageTableState {
    showInfo: boolean;
    showWarning: boolean;
    showError: boolean;
    column: string;
    direction: string;
}

export interface MessageTableFeatureState {
    messageTable: MessageTableState;
}