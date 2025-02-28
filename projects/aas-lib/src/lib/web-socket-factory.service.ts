/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { WebSocketData } from 'aas-core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
    providedIn: 'root',
})
export class WebSocketFactoryService {
    /**
     * Creates a subject that communicates with a server via WebSocket.
     * @param url The URL of the source.
     * @returns A subject.
     */
    public create(url?: string): WebSocketSubject<WebSocketData> {
        if (!url) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            url = `${protocol}//${window.location.host}/websocket`;
        }

        return webSocket(url);
    }
}
