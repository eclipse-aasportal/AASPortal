/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASCursor, AASDocument, AASEndpoint, AASPage } from 'common';
import { AASFilter } from './aas-filter.js';

export abstract class AASIndex {
    public abstract getEndpoints(): Promise<AASEndpoint[]>;

    public abstract getEndpoint(name: string): Promise<AASEndpoint>;

    public abstract setEndpoint(endpoint: AASEndpoint): Promise<void>;

    public abstract removeEndpoint(name: string): Promise<boolean>;
    
    public abstract getDocuments(cursor: AASCursor, filter?: AASFilter): Promise<AASPage>;

    public abstract getContainerDocuments(endpointName: string): Promise<AASDocument[]>;

    public abstract set(document: AASDocument): Promise<void>;

    public abstract add(document: AASDocument): Promise<void>;

    public abstract has(endpointName: string | undefined, id: string): Promise<boolean>;

    public abstract get(endpointName: string | undefined, id: string): Promise<AASDocument>;

    public abstract remove(endpointName?: string, id?: string): Promise<boolean>;

    public abstract reset(): Promise<void>;
}