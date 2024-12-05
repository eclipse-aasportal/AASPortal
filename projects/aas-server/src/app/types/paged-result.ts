/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export interface PagedResultPagingMetadata {
    cursor?: string;
}

export interface PagedResult<T> {
    result: T[];
    paging_metadata: PagedResultPagingMetadata;
}
