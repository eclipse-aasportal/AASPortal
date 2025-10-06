/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Database } from './database.js';

export abstract class DatabaseCommand<TResult> {
    protected constructor(protected readonly database: Database) {}

    public abstract execute(): Promise<TResult>;
}
