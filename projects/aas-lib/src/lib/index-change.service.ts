/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, EventEmitter, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { WebSocketData, AASServerMessage } from 'aas-core';
import { WebSocketFactoryService } from './web-socket-factory.service';
import { HttpClient } from '@angular/common/http';

interface State {
    documentCount: number;
    endpointCount: number;
    changedDocuments: number;
}

@Injectable({
    providedIn: 'root',
})
export class IndexChangeService {
    private webSocketSubject?: WebSocketSubject<WebSocketData>;
    private readonly state = signal<State>({
        documentCount: 0,
        endpointCount: 0,
        changedDocuments: 0,
    });

    public constructor(
        private readonly http: HttpClient,
        private readonly webSocketFactory: WebSocketFactoryService,
        private readonly translate: TranslateService,
    ) {
        this.subscribeIndexChanged();

        this.http.get<{ count: number }>('/api/v1/endpoints/count').subscribe({
            next: result => {
                this.state.update(state => ({ ...state, endpointCount: result.count }));
            },
            error: error => {
                console.debug(error);
            },
        });

        this.http
            .get<{ count: number }>('/api/v1/documents/count')
            .subscribe(result => this.state.update(state => ({ ...state, documentCount: result.count })));
    }

    public readonly reset = new EventEmitter();

    public readonly summary = computed(() => {
        const state = this.state();
        if (state.changedDocuments === 0) {
            return `${state.documentCount} ${this.translate.instant('IndexChangeService.SHELLS')} / ${state.endpointCount} ${this.translate.instant('IndexChangeService.ENDPOINTS')}`;
        }

        return `${state.documentCount} ${this.translate.instant('IndexChangeService.SHELLS')} (${state.changedDocuments}) / ${state.endpointCount} ${this.translate.instant('IndexChangeService.ENDPOINTS')}`;
    });

    public readonly documentCount = computed(() => this.state().documentCount);

    public readonly endpointCount = computed(() => this.state().endpointCount);

    public readonly changedDocuments = computed(() => this.state().changedDocuments);

    public clear(): void {
        this.state.update(state => ({ ...state, changedDocuments: 0 }));
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
