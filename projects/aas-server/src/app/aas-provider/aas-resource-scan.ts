/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'events';
import { AASDocument } from 'aas-core';
import { PagedResult } from '../types/paged-result.js';

/** Defines an automate to scan an AAS resource for Asset Administration Shells. */
export abstract class AASResourceScan extends EventEmitter {
    /**
     * Gets all documents of the current container.
     * @param cursor ToDo.
     * */
    public abstract scanAsync(cursor?: string): Promise<PagedResult<AASDocument>>;
}
