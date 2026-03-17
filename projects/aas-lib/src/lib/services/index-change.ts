/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, EventEmitter, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AASNodeMessage, WebSocketData } from 'aas-core';
import { WebSocketService } from './web-socket.service';
import { HttpClient } from '@angular/common/http';
import { first, map, mergeMap, Observable, Subscription, zip } from 'rxjs';
import { AuthService } from '../components/auth/auth.service';

type State = {
    documentCount: number;
    endpointCount: number;
    changedDocuments: number;
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
    private readonly auth = inject(AuthService);
    private readonly webSocket = inject(WebSocketService);
    private readonly subscription: Subscription;
    private readonly state = signal<State>({
        documentCount: 0,
        endpointCount: 0,
        changedDocuments: 0,
    });

    public constructor() {
        this.subscription = this.webSocket.getMessages().subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASNodeMessage') {
                    this.update(data.data as AASNodeMessage);
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
     * Event emitted when a reset message is received, indicating that the index has been reset and
     * the state should be cleared.
     */
    public readonly reset = new EventEmitter();

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
            this.http.get<{ count: number }>('/api/v1/documents/count'),
        ).pipe(
            map(([endpointCount, documentCount]) => [endpointCount.count, documentCount.count]),
            map(([endpointCount, documentCount]) =>
                this.state.set({ endpointCount, documentCount, changedDocuments: 0 }),
            ),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    private update(data: AASNodeMessage): void {
        switch (data.type) {
            case 'Added':
                this.documentAdded();
                break;
            case 'Removed':
                this.documentRemoved();
                break;
            case 'Update':
                this.documentUpdate();
                break;
            case 'EndpointAdded':
                this.endpointAdded();
                break;
            case 'EndpointRemoved':
                this.endpointRemoved();
                break;
            case 'Reset':
                this.reset.emit();
                this.clear().pipe(first()).subscribe();
                break;
        }
    }

    private documentAdded(): void {
        this.state.update(state => ({ ...state, documentCount: state.documentCount + 1 }));
    }

    private documentRemoved(): void {
        this.state.update(state => ({ ...state, documentCount: state.documentCount - 1 }));
    }

    private documentUpdate(): void {
        this.state.update(state => ({ ...state, changedDocuments: state.changedDocuments + 1 }));
    }

    private endpointAdded(): void {
        this.state.update(state => ({ ...state, endpointCount: state.endpointCount + 1 }));
    }

    private endpointRemoved(): void {
        this.state.update(state => ({ ...state, endpointCount: state.endpointCount - 1 }));
    }
}
