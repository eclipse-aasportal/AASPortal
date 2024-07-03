/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LiveNode, noop } from 'aas-core';
import { SocketItem } from '../socket-item.js';

export class HttpSocketItem implements SocketItem {
    public constructor(
        public readonly node: LiveNode,
        public readonly url: string,
    ) {}

    public subscribe(): void {
        noop();
    }

    public unsubscribe(): void {
        noop();
    }
}
