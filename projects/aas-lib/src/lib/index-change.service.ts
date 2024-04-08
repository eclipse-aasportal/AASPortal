/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { EventEmitter, Injectable } from '@angular/core';
import { WebSocketData, AASServerMessage } from 'common';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketFactoryService } from './web-socket-factory.service';
import { NotifyService } from '../public-api';

interface State {
    addedDocuments: number;
    changedDocuments: number;
    removedDocuments: number;
    addedEndpoints: number;
    removedEndpoints: number;
}

@Injectable({
    providedIn: 'root',
})
export class IndexChangeService {
    private webSocketSubject?: WebSocketSubject<WebSocketData>;
    private readonly _reset = new EventEmitter<void>();
    private readonly state$ = new BehaviorSubject<State>({
        addedDocuments: 0,
        changedDocuments: 0,
        removedDocuments: 0,
        addedEndpoints: 0,
        removedEndpoints: 0,
    });

    public constructor(
        private readonly webSocketFactory: WebSocketFactoryService,
        private readonly notify: NotifyService,
    ) {
        this.subscribeIndexChanged();

        this.count = this.state$
            .asObservable()
            .pipe(
                map(
                    state =>
                        state.addedDocuments +
                        state.changedDocuments +
                        state.removedDocuments +
                        state.addedEndpoints +
                        state.removedEndpoints,
                ),
            );
    }

    public readonly reset = new EventEmitter();

    public count: Observable<number>;

    public clear(): void {
        this.state$.next({
            addedDocuments: 0,
            changedDocuments: 0,
            removedDocuments: 0,
            addedEndpoints: 0,
            removedEndpoints: 0,
        });
    }

    private subscribeIndexChanged = (): void => {
        this.webSocketSubject = this.webSocketFactory.create();
        this.webSocketSubject.subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASServerMessage') {
                    this.update(data.data as AASServerMessage);
                }
            },
            error: (): void => {
                setTimeout(this.subscribeIndexChanged, 2000);
            },
        });

        this.webSocketSubject.next(this.createMessage());
    };

    private createMessage(): WebSocketData {
        return {
            type: 'IndexChange',
            data: null,
        } as WebSocketData;
    }

    private update(data: AASServerMessage): void {
        switch (data.type) {
            case 'Added':
                this.documentAdded();
                break;
            case 'Removed':
                this.documentRemoved();
                break;
            case 'Changed':
                this.documentChanged();
                break;
            case 'EndpointAdded':
                this.endpointAdded();
                break;
            case 'EndpointRemoved':
                this.endpointRemoved();
                break;
            case 'Reset':
                this.reset.emit();
                break;
        }
    }

    private documentAdded(): void {
        const state = this.state$.getValue();
        this.state$.next({ ...state, addedDocuments: state.addedDocuments + 1 });
    }

    private documentRemoved(): void {
        const state = this.state$.getValue();
        this.state$.next({ ...state, removedDocuments: state.removedDocuments + 1 });
    }

    private documentChanged(): void {
        const state = this.state$.getValue();
        this.state$.next({ ...state, changedDocuments: state.changedDocuments + 1 });
    }

    private endpointAdded(): void {
        const state = this.state$.getValue();
        this.state$.next({ ...state, addedEndpoints: state.addedEndpoints + 1 });
    }

    private endpointRemoved(): void {
        const state = this.state$.getValue();
        this.state$.next({ ...state, removedEndpoints: state.removedEndpoints + 1 });
    }
}
