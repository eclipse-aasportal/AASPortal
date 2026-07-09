/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AASNodeMessage, WebSocketData } from 'aas-core';
import { HttpClient } from '@angular/common/http';
import { first, map, mergeMap, Observable, Subscription, zip } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { AuthService } from '../core/auth/auth.service';
import { HttpCache } from './http-cache';

type State = {
    documentCount: number;
    endpointCount: number;
    changedDocuments: number;
    endpoints: string[];
};

/**
 * Service to track changes in the index of the AASNode application.
 * It listens to WebSocket messages and updates the state accordingly.
 */
@Injectable({
    providedIn: 'root',
})
export class IndexChange implements OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly cache = inject(HttpCache);
    private readonly auth = inject(AuthService);
    private readonly webSocket = inject(WebSocketService);
    private readonly subscription: Subscription;
    private readonly state = signal<State>({
        documentCount: 0,
        endpointCount: 0,
        changedDocuments: 0,
        endpoints: [],
    });

    public constructor() {
        this.subscription = this.webSocket.getMessages().subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASNodeMessage[]') {
                    this.update(data.data as AASNodeMessage[]);
                }
            },
            error: (error): void => {
                console.error(error);
            },
        });

        this.webSocket.sendMessage({
            type: 'IndexChange',
            data: null,
        } satisfies WebSocketData);

        this.auth.ready
            .pipe(
                first(ready => ready === true),
                mergeMap(() => this.clear()),
            )
            .subscribe();
    }

    /**
     * Observable that emits the current count of documents in the index.
     */
    public readonly documentCount = computed(() => this.state().documentCount);

    /**
     * Observable that emits the current count of endpoints in the index.
     */
    public readonly endpointCount = computed(() => this.state().endpointCount);

    /**
     * Observable that emits the count of changed documents since the last reset.
     */
    public readonly changedDocuments = computed(() => this.state().changedDocuments);

    /**
     * Clears the state of the service by fetching the current counts of endpoints and documents from the API.
     * @returns An Observable that completes when the state has been updated.
     */
    public clear(): Observable<void> {
        return zip(
            this.http.get<{ count: number }>('/api/v1/endpoints/count'),
            this.http.get<{ count: number }>('/api/v1/endpoints/documents-count'),
        ).pipe(
            map(([endpointCount, documentCount]) => [endpointCount.count, documentCount.count]),
            map(([endpointCount, documentCount]) =>
                this.state.set({ endpointCount, documentCount, changedDocuments: 0, endpoints: [] }),
            ),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private update(messages: AASNodeMessage[]): void {
        for (const message of messages) {
            switch (message.type) {
                case 'Added':
                    this.state.update(state => ({ ...state, documentCount: ++state.documentCount }));
                    break;
                case 'Removed':
                    this.state.update(state => ({ ...state, documentCount: --state.documentCount }));
                    this.cache.clear();
                    break;
                case 'Update':
                    this.state.update(state => ({ ...state, changedDocuments: ++state.changedDocuments }));
                    this.cache.clear();
                    break;
                case 'EndpointAdded':
                    this.state.update(state => ({ ...state, endpointCount: ++state.endpointCount }));
                    break;
                case 'EndpointRemoved':
                    this.state.update(state => ({ ...state, endpointCount: --state.endpointCount }));
                    this.cache.clear();
                    break;
                case 'Reset':
                    this.state.update(state => ({ ...state, documentCount: 0, changedDocuments: 0 }));
                    this.cache.clear();
                    break;
                case 'End':
                    this.state.update(state => ({
                        ...state,
                        endpoints: [
                            ...state.endpoints,
                            ...messages.filter(m => m.type === 'End').map(m => m.endpoint.name),
                        ],
                    }));
                    break;
            }
        }
    }
}
