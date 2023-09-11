/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { EventEmitter } from 'events';

/** Abstract base class of an AAS endpoint scan. */
export abstract class  AASEndpointScan extends EventEmitter {

    /** Scans for containers in the current endpoint. */
    public abstract scanAsync(): Promise<void>;
}