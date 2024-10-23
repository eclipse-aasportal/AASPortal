/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, Message, TemplateDescriptor, AASEndpoint } from 'aas-core';

export enum ScanResultType {
    Added,
    Removed,
    Changed,
    Update,
    NextPage,
    End,
}

/** The result of a container scan. */
export interface ScanResult {
    /** The result. */
    type: ScanResultType;
    /** The task identifier. */
    taskId: number;
    /** The message memory. */
    messages?: Message[];
}

/** The result of an endpoint scan. */
export interface ScanEndpointResult extends ScanResult {
    endpoint: AASEndpoint;
    document: AASDocument;
}

/** The result of a template scan. */
export interface ScanTemplatesResult extends ScanResult {
    templates: TemplateDescriptor[];
}
