/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, EventEmitter, Injectable, signal } from '@angular/core';
import { WebSocketData, AASServerMessage } from 'aas-core';
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
    private readonly state = signal<State>({
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
    }

    public readonly reset = new EventEmitter();

    public readonly count = computed(() => {
        const state = this.state();
        return (
            state.addedDocuments +
            state.addedEndpoints +
            state.changedDocuments +
            state.removedDocuments +
            state.removedEndpoints
        );
    });

    public readonly summary = computed(() => {
        const state = this.state();
        return `+${state.addedDocuments}/${state.changedDocuments}/-${state.removedDocuments}; +${state.addedEndpoints}/-${state.removedEndpoints}`;
    });

    public readonly addedDocuments = computed(() => this.state().addedDocuments);
    public readonly addedEndpoints = computed(() => this.state().addedEndpoints);
    public readonly changedDocuments = computed(() => this.state().changedDocuments);
    public readonly removedDocuments = computed(() => this.state().removedDocuments);
    public readonly removedEndpoints = computed(() => this.state().removedEndpoints);

    public clear(): void {
        this.state.set({
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
                break;
        }
    }

    private documentAdded(): void {
        this.state.update(state => ({ ...state, addedDocuments: state.addedDocuments + 1 }));
    }

    private documentRemoved(): void {
        this.state.update(state => ({ ...state, removedDocuments: state.removedDocuments + 1 }));
    }

    private documentUpdate(): void {
        this.state.update(state => ({ ...state, changedDocuments: state.changedDocuments + 1 }));
    }

    private endpointAdded(): void {
        this.state.update(state => ({ ...state, addedEndpoints: state.addedEndpoints + 1 }));
    }

    private endpointRemoved(): void {
        this.state.update(state => ({ ...state, removedEndpoints: state.removedEndpoints + 1 }));
    }
}
