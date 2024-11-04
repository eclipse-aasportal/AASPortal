/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, Message, TemplateDescriptor, AASEndpoint } from 'aas-core';

export enum ScanResultType {
    Add,
    Remove,
    Update,
    End,
}

/** The result of an endpoint scan. */
export interface ScanResult {
    type: ScanResultType;
    taskId: number;
    start: number;
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
