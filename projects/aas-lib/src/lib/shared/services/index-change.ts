/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { UpdateIndexStatus, AASNodeMessage, WebSocketData } from 'aas-core';
import { HttpClient, httpResource } from '@angular/common/http';
import { mergeMap, Observable, of, Subject, Subscription } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { DocumentCache } from './document-cache';
import { encodeBase64Url } from '../../utilities';

/**
 * Service to track changes in the index of the AASNode application.
 * It listens to WebSocket messages and updates the state accordingly.
 */
@Injectable({
    providedIn: 'root',
})
export class IndexChange implements OnDestroy {
    private readonly cache = inject(DocumentCache);
    private readonly http = inject(HttpClient);
    private readonly webSocket = inject(WebSocketService);
    private readonly subscription: Subscription;
    private readonly _documentCount = httpResource<number>(() => '/api/v1/endpoints/document-count', {
        defaultValue: 0,
    });

    private readonly _endpointCount = httpResource<number>(() => '/api/v1/endpoints/endpoint-count', {
        defaultValue: 0,
    });

    private readonly _changedDocuments = signal(0);
    private readonly _progress = signal<{
        endpoint: string;
        start: number;
        progress: number;
        shellCount: number;
        submodelCount: number;
    }>({
        endpoint: '',
        start: 0,
        progress: 0,
        shellCount: 0,
        submodelCount: 0,
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
    }

    /**
     * Observable that emits the current count of documents in the index.
     */
    public readonly documentCount = this._documentCount.value.asReadonly();

    /**
     * Observable that emits the current count of endpoints in the index.
     */
    public readonly endpointCount = this._endpointCount.value.asReadonly();

    /**
     * Observable that emits the count of changed documents since the last reset.
     */
    public readonly changedDocuments = this._changedDocuments.asReadonly();

    /**
     * Observable that emits when an endpoint scan starts, providing the endpoint and start time.
     * The emitted object has the shape: { endpoint: string; start: number }
     * where 'endpoint' is the name of the endpoint being scanned and 'start' is the timestamp of when the scan started.
     * This can be used to track the progress of endpoint scans in real-time.
     */
    public readonly startUpdate = new Subject<{ endpoint: string; start: number }>();

    /**
     * Observable that emits when an endpoint scan ends, providing the endpoint and start time.
     * The emitted object has the shape: { endpoint: string; start: number }
     * where 'endpoint' is the name of the endpoint that was scanned and 'start' is the timestamp of when the scan started.
     * This can be used to track the completion of endpoint scans in real-time.
     */
    public readonly endUpdate = new Subject<{ endpoint: string; start: number }>();

    /**
     * Signals progress updates for an ongoing endpoint scan.
     * The emitted object has the shape: { progress: number; shellCount: number; submodelCount: number }
     * where 'progress' is a number between 0 and 100 indicating the completion percentage of the scan,
     * 'shellCount' is the number of shells processed, and 'submodelCount' is the number of submodels processed.
     * This can be used to provide real-time feedback on the progress of endpoint scans.
     */
    public readonly progress = this._progress.asReadonly();

    /**
     * Signals when the index has been cleared, providing the name of the endpoint that was cleared.
     * If the index for all endpoints was cleared, the emitted value will be undefined.
     */
    public readonly cleared = new Subject<string | undefined>();

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    /**
     * Clears the state of the service by fetching the current counts of endpoints and documents from the API.
     * @returns An Observable that completes when the state has been updated.
     */
    public reload(): void {
        this._documentCount.reload();
        this._endpointCount.reload();
    }

    /**
     * Clears the index of a specific endpoint or all endpoints.
     * If an endpoint name is provided, it will clear the index for that specific endpoint.
     * If no endpoint name is provided, it will clear the index for all endpoints.
     * @param endpoint The name of the endpoint to clear the index for. If not provided, all endpoints will be cleared.
     * @returns An Observable that completes when the index has been cleared.
     */
    public clearIndex(endpoint?: string): Observable<void> {
        if (endpoint) {
            return this.http
                .delete(`api/v1/index/${encodeBase64Url(endpoint)}/clear-index`)
                .pipe(mergeMap(() => of(void 0)));
        }

        return this.http.delete(`api/v1/index/clear-index`).pipe(mergeMap(() => of(void 0)));
    }

    /**
     * Starts the update index process for a specific endpoint.
     * This operation triggers the backend to begin scanning and updating the index for the specified endpoint.
     * @param endpoint The name of the endpoint for which to start the index update process.
     * @returns An Observable that completes when the index update process has been initiated.
     */
    public startUpdateIndex(endpoint: string): Observable<void> {
        return this.http
            .put(`api/v1/endpoints/${encodeBase64Url(endpoint)}/start-scan`, null)
            .pipe(mergeMap(() => of(void 0)));
    }

    /**
     * Cancels the update index process for a specific endpoint.
     * This operation triggers the backend to stop scanning and updating the index for the specified endpoint.
     * @param endpoint The name of the endpoint for which to cancel the index update process.
     * @returns An Observable that completes when the index update process has been canceled.
     */
    public cancelUpdateIndex(endpoint: string): Observable<void> {
        return this.http
            .put(`api/v1/endpoints/${encodeBase64Url(endpoint)}/cancel-scan`, null)
            .pipe(mergeMap(() => of(void 0)));
    }

    /**
     * Gets information whether an update index process is currently running for a specific endpoint.
     * This operation queries the backend for the current status of the index update process for the specified endpoint.
     * @param endpoint The name of the endpoint for which to check the index update status.
     * @returns Returns an Observable that emits the current status of the index update process for the specified endpoint.
     */
    public getUpdateStatus(endpoint: string): Observable<UpdateIndexStatus> {
        return this.http.get<UpdateIndexStatus>(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/status`);
    }

    private update(messages: AASNodeMessage[]): void {
        for (const message of messages) {
            switch (message.type) {
                case 'Start':
                    this.startUpdate.next({ endpoint: message.endpoint, start: message.start });
                    break;
                case 'Added':
                    this._documentCount.update(value => value + 1);
                    break;
                case 'Removed':
                    this._documentCount.update(value => value - 1);
                    this.cache.clear();
                    break;
                case 'Updated':
                    this._changedDocuments.update(value => value + 1);
                    this.cache.clear();
                    break;
                case 'EndpointAdded':
                    this._endpointCount.update(value => value + 1);
                    break;
                case 'EndpointRemoved':
                    this._endpointCount.update(value => value - 1);
                    this.cache.clear();
                    break;
                case 'Cleared':
                    this.reload();
                    this._changedDocuments.set(0);
                    this.cache.clear();
                    this.cleared.next(message.endpoint);
                    break;
                case 'Progress':
                    this._progress.set({
                        endpoint: message.endpoint,
                        start: message.start,
                        progress: message.progress,
                        shellCount: message.shellCount,
                        submodelCount: message.submodelCount,
                    });
                    break;
                case 'End': {
                    this.endUpdate.next({ endpoint: message.endpoint, start: message.start });
                    break;
                }
            }
        }
    }
}
