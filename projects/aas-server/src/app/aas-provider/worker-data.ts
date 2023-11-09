/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer, AASEndpoint } from "common";
import { ScanStatistic } from "./scan-result.js";

export interface WorkerData {
    taskId: number;
    type: 'ScanContainerData' | 'ScanEndpointData';
    statistic: ScanStatistic;
}

export interface ScanContainerData extends WorkerData {
    type: 'ScanContainerData';
    container: AASContainer;
}

export interface ScanEndpointData extends WorkerData {
    type: 'ScanEndpointData';
    endpoint: AASEndpoint;
    containers: AASContainer[];
}

export function isScanContainerData(data: WorkerData): data is ScanContainerData {
    return data.type === 'ScanContainerData';
}

export function isScanEndpointData(data: WorkerData): data is ScanEndpointData {
    return data.type === 'ScanEndpointData';
}