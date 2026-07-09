/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Endpoint, AASDocument, TemplateDescriptor, AASEndpoint, UserRole, EndpointAuth } from 'aas-core';
import { aasV2 } from 'aas-package';

/** Extend Express Request type to include 'user' */
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            name: string;
            role: UserRole;
            endpoints?: EndpointAuth[];
        };
    }
}

declare module 'express-session' {
    interface SessionData {
        access_token?: string;
        refresh_token?: string;
        code_verifier?: string;
        endpoints?: EndpointAuth[];
        session_state?: string;
        state?: string;
    }
}

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

export function isScanEndpointResult(result: ScanResult): result is ScanEndpointResult {
    return result.type === 'ScanEndpointResult';
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

export function isScanEndpointData(data: WorkerData): data is ScanEndpointData {
    return data.type === 'ScanEndpointData';
}

export type EventListener = (...args: unknown[]) => void;
