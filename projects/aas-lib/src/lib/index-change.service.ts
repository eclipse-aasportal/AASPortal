/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, EventEmitter, Injectable, OnDestroy, signal } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { AASNodeMessage, WebSocketData } from 'aas-core';
import { WebSocketFactoryService } from './web-socket-factory.service';
import { HttpClient } from '@angular/common/http';
import { first, map, mergeMap, Observable, Subscription, zip } from 'rxjs';
import { AuthService } from '../public-api';

type State = {
    documentCount: number;
    endpointCount: number;
    changedDocuments: number;
};

@Injectable({
    providedIn: 'root',
})
export class IndexChangeService implements OnDestroy {
    private subscription?: Subscription;
    private readonly state = signal<State>({
        documentCount: 0,
        endpointCount: 0,
        changedDocuments: 0,
    });

    public constructor(
        private readonly http: HttpClient,
        private readonly webSocketFactory: WebSocketFactoryService,
        private readonly auth: AuthService,
    ) {
        const message = this.webSocketFactory.create();
        this.subscription = message.subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASNodeMessage') {
                    this.update(data.data as AASNodeMessage);
                }
            },
            error: (error): void => {
                console.error(error);
            },
        });

        message.next(this.createMessage());
        this.message = message.asObservable();

        this.auth.userId
            .pipe(
                first(userId => userId !== undefined),
                mergeMap(() =>
                    zip(
                        this.http.get<{ count: number }>('/api/v1/endpoints/count'),
                        this.http.get<{ count: number }>('/api/v1/documents/count'),
                    ).pipe(map(([endpointCount, documentCount]) => [endpointCount.count, documentCount.count])),
                ),
            )
            .subscribe(([endpointCount, documentCount]) => {
                this.state.update(state => ({ ...state, endpointCount, documentCount }));
            });
    }

    public readonly reset = new EventEmitter();

    public readonly message: Observable<WebSocketData>;

    public readonly documentCount = computed(() => this.state().documentCount);

    public readonly endpointCount = computed(() => this.state().endpointCount);

    public readonly changedDocuments = computed(() => this.state().changedDocuments);

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
        this.subscription?.unsubscribe();
    }

    private createMessage(): WebSocketData {
        return {
            type: 'IndexChange',
            data: null,
        } satisfies WebSocketData;
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
                this.state.set({ changedDocuments: 0, documentCount: 0, endpointCount: 0 });
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
