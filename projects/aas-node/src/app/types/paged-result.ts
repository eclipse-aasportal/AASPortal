/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type PagedResultPagingMetadata = {
    cursor?: string;
};

export type PagedResult<T> = {
    result: T[];
    paging_metadata: PagedResultPagingMetadata;
};
