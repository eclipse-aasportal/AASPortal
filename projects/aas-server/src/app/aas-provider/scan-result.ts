/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASContainer, Message, TemplateDescriptor } from 'aas-core';

export enum ScanResultType {
    Added,
    Removed,
    Changed,
    Update,
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

/** The result of a container scan. */
export interface ScanContainerResult extends ScanResult {
    /** The AAS container. */
    container: AASContainer;
    /** The result subject. */
    document: AASDocument;
}

/** The result of a container scan. */
export interface ScanTemplatesResult extends ScanResult {
    templates: TemplateDescriptor[];
}
