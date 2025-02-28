/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LiveNode } from 'aas-core';

export interface SocketItem {
    node: LiveNode;
    subscribe(item: unknown): void;
    unsubscribe(): void;
}
