/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { WebSocketFactoryService } from 'projects/aas-lib/src/public-api';
import { WebSocketData } from 'common';
import { Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';

export class TestWebSocketFactoryService implements Partial<WebSocketFactoryService> {
    public constructor(private readonly subject: Subject<WebSocketData>) {}

    public create(): WebSocketSubject<WebSocketData> {
        return this.subject as WebSocketSubject<WebSocketData>;
    }
}