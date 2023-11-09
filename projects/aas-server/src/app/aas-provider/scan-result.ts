/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASContainer, Message, AASEndpoint } from 'common';

export enum ScanResultType {
    Added,
    Removed,
    Changed,
    ContainerAdded,
    ContainerRemoved,
    End
}

/** Provides statistic information about a container scan. */
export interface ScanStatistic {
    /** Start time. */
    start: number;
    /** End time */
    end: number,
    /** The number of scan cycles. */
    counter: number,
    /** The number of changed AAS documents.*/
    changed: number,
    /** The number of new AAS documents. */
    new: number,
    /** The number of deleted AAS documents. */
    deleted: number,
    /** The number of offline events. */
    offline: number
}

/** The result of a container scan. */
export interface ScanResult {
    /** The result. */
    type: ScanResultType,
    /** The task identifier. */
    taskId: number;
    /** Statistic information. */
    statistic: ScanStatistic;
    /** The message memory. */
    messages?: Message[];
}

/** The result of an AASServer endpoint scan. */
export interface ScanEndpointResult extends ScanResult {
    /** The AAS registry. */
    endpoint: AASEndpoint;
    /** The result subject. */
    container: AASContainer;
}

/** The result of a container scan. */
export interface ScanContainerResult extends ScanResult {
    /** The AAS container. */
    container: AASContainer;
    /** The result subject. */
    document: AASDocument;
}

/** Indicates whether the specified result is of type `ScanEndpointResult`. */
export function isScanEndpointResult(result: ScanResult): result is ScanEndpointResult {
    return result.type === ScanResultType.ContainerAdded || result.type === ScanResultType.ContainerRemoved;
}

/** Indicates whether the specified result is of type `ScanContainerResult`. */
export function isScanContainerResult(result: ScanResult): result is ScanContainerResult {
    return result.type === ScanResultType.Added || result.type === ScanResultType.Changed ||
        result.type === ScanResultType.Removed;
}