/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export interface AASQueryParams {
    format?: string;
    id?: string;
}

export interface AASQuery {
    id: string;
    name?: string;
    search?: string;
}
