/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Database } from './database.js';

export abstract class DatabaseCommand {
    protected constructor(
        protected readonly database: Database,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public readonly resolve: (result: void | any) => void,
        public readonly reject: (reason: Error) => void,
    ) {}

    public abstract execute(): Promise<void | unknown>;
}
