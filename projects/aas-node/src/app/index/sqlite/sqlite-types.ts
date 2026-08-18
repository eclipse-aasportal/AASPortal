/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { SQLOutputValue } from 'node:sqlite';
import { AASEndpointType } from 'aas-core';

export type SqliteEndpoint = Record<string, SQLOutputValue> & {
    name: string;
    url: string;
    type: AASEndpointType;
    version: string | null;
    headers: string | null;
    schedule: string | null;
};
