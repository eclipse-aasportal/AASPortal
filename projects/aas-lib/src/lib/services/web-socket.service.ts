/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { noop, WebSocketData } from 'aas-core';
import { Observable, retry, timer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private readonly socket$: WebSocketSubject<WebSocketData>;
    private reconnectInterval = 5000; // 5 seconds

    /**
     * Creates a subject that communicates with a server via WebSocket.
     * @param url The URL of the source.
     * @returns A subject.
     */
    public constructor() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/websocket`;
        this.socket$ = webSocket(url);

        this.socket$
            .pipe(
                retry({
                    delay: () => {
                        console.log(
                            `WebSocket connection failed. Retrying in ${this.reconnectInterval / 1000} seconds...`,
                        );

                        return timer(this.reconnectInterval);
                    },
                }),
            )
            .subscribe({
                next: (message: WebSocketData) => this.handleMessage(message),
                error: error => console.error('WebSocket error:', error),
                complete: () => console.log('WebSocket connection closed'),
            });
    }

    /**
     * Sends a message to the server via WebSocket.
     * @param message The message to send.
     */
    public sendMessage(message: WebSocketData): void {
        this.socket$.next(message);
    }

    /**
     * Gets messages from the server via WebSocket.
     * @returns The messages from the server.
     */
    public getMessages(): Observable<WebSocketData> {
        return this.socket$.asObservable();
    }

    /**
     * Closes the WebSocket connection.
     */
    public closeConnection(): void {
        this.socket$.complete();
    }

    private handleMessage(message: WebSocketData): void {
        noop(message);
    }
}
