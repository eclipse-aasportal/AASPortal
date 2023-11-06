/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASCursor, AASDocument, AASPage } from 'common';
import { AASFilter } from './aas-filter.js';

export abstract class AASIndex {
    public abstract getDocuments(cursor: AASCursor, filter?: AASFilter): Promise<AASPage>;

    public abstract getContainerDocuments(url: string): Promise<AASDocument[]>;

    public abstract set(document: AASDocument): Promise<void>;

    public abstract add(document: AASDocument): Promise<void>;

    public abstract has(url: string | undefined, id: string): Promise<boolean>;

    public abstract get(url: string | undefined, id: string): Promise<AASDocument>;

    public abstract delete(url?: string, id?: string): Promise<void>;
}