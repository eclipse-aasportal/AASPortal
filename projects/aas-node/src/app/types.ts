/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Endpoint, AASDocument, TemplateDescriptor, AASEndpoint } from 'aas-core';
import { aasV2 } from 'aas-package';

export interface AASRegistryModelType {
    name: 'AssetAdministrationShellDescriptor' | 'Asset';
}

/** The self-describing information of a network resource. */
export interface AASRegistryDescriptor {
    endpoints: Endpoint[];
}

/** Descriptor of a Submodel. */
export interface SubmodelDescriptor extends AASRegistryDescriptor {
    identification: aasV2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset. */
export interface AssetDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasV2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset Administration Shell */
export interface AssetAdministrationShellDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasV2.Identifier;
    idShort: string;
    asset: AssetDescriptor;
    submodels: SubmodelDescriptor[];
}

export enum ScanResultKind {
    Add,
    Remove,
    Update,
    End,
}

/** The result of an endpoint scan. */
export interface ScanResult {
    type: 'ScanEndResult' | 'ScanEndpointResult';
    kind: ScanResultKind;
    taskId: number;
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

export interface WorkerData {
    taskId: number;
    type: 'ScanEndpointData';
}

export interface ScanEndpointData extends WorkerData {
    type: 'ScanEndpointData';
    endpoint: AASEndpoint;
}

export type EventListener = (...args: unknown[]) => void;
