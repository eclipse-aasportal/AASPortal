/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { WebSocketData } from 'aas-core';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketFactoryService } from '../../lib/web-socket-factory.service';

export class TestWebSocketFactoryService implements Partial<WebSocketFactoryService> {
    public constructor(private readonly subject: Subject<WebSocketData>) {}

    public create(): WebSocketSubject<WebSocketData> {
        return this.subject as WebSocketSubject<WebSocketData>;
    }
}