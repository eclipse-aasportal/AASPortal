/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { firstValueFrom, lastValueFrom, Subject } from 'rxjs';
import { ApplicationRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UpdateIndexStatus, WebSocketData } from 'aas-core';
import { createSpyObj } from '../../../test/mocks';
import { WebSocketService } from './web-socket.service';
import { IndexChange } from './index-change';
import { DocumentCache } from './document-cache';
import { encodeBase64Url } from '../../utilities';

describe('IndexChange', () => {
    let service: IndexChange;
    let webSocket: Mocked<WebSocketService>;
    let cache: Mocked<DocumentCache>;
    let controller: HttpTestingController;
    let app: ApplicationRef;
    const subject = new Subject<WebSocketData>();

    beforeEach(async () => {
        webSocket = createSpyObj<WebSocketService>(['sendMessage', 'getMessages']);
        webSocket.getMessages.mockReturnValue(subject.asObservable());
        cache = createSpyObj<DocumentCache>(['clear']);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: WebSocketService,
                    useValue: webSocket,
                },
                {
                    provide: DocumentCache,
                    useValue: cache,
                },
                provideHttpClient(),
                provideHttpClientTesting(),
            ],
        });

        app = TestBed.inject(ApplicationRef);
        controller = TestBed.inject(HttpTestingController);
        service = TestBed.inject(IndexChange);

        app.tick();
        controller.expectOne('/api/v1/endpoints/document-count').flush(42);
        controller.expectOne('/api/v1/endpoints/endpoint-count').flush(5);
        await app.whenStable();
    });

    afterEach(() => {
        controller.verify();
    });

    it('should be created', () => {
        expect(service).toBeInstanceOf(IndexChange);
        expect(service.documentCount()).toBe(42);
        expect(service.endpointCount()).toBe(5);
    });

    describe('clear', () => {
        it('should clear the current state', async () => {
            service.reload();
            app.tick();
            controller.expectOne('/api/v1/endpoints/document-count').flush(1);
            controller.expectOne('/api/v1/endpoints/endpoint-count').flush(33);
            await app.whenStable();

            expect(service.documentCount()).toBe(1);
            expect(service.endpointCount()).toBe(33);
        });
    });

    describe('websocket messages', () => {
        it('should notify document added', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Added',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.documentCount()).toBe(43);
            expect(service.endpointCount()).toBe(5);
            expect(service.changedDocuments()).toBe(0);
        });

        it('should notify document removed', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Removed',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.documentCount()).toBe(41);
            expect(service.endpointCount()).toBe(5);
            expect(service.changedDocuments()).toBe(0);
            expect(cache.clear).toHaveBeenCalled();
        });

        it('should notify document updated', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Updated',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.documentCount()).toBe(42);
            expect(service.endpointCount()).toBe(5);
            expect(service.changedDocuments()).toBe(1);
            expect(cache.clear).toHaveBeenCalled();
        });

        it('should notify endpoint added', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'EndpointAdded',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.documentCount()).toBe(42);
            expect(service.endpointCount()).toBe(6);
            expect(service.changedDocuments()).toBe(0);
        });

        it('should notify endpoint removed', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'EndpointRemoved',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.documentCount()).toBe(42);
            expect(service.endpointCount()).toBe(4);
            expect(service.changedDocuments()).toBe(0);
            expect(cache.clear).toHaveBeenCalled();
        });

        it('should emit start and end events on Start and End messages', async () => {
            const startMessage = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Start',
                        start: 1,
                        endpoint: 'test-endpoint',
                    },
                ],
            } satisfies WebSocketData;

            const endMessage = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'End',
                        start: 1,
                        endpoint: 'test-endpoint',
                    },
                ],
            } satisfies WebSocketData;

            let promise = firstValueFrom(subject);
            const startPromise = firstValueFrom(service.startUpdate);
            subject.next(startMessage);
            await promise;
            await expect(startPromise).resolves.toEqual({ endpoint: 'test-endpoint', start: 1 });

            promise = firstValueFrom(subject);
            const endPromise = firstValueFrom(service.endUpdate);
            subject.next(endMessage);
            await promise;
            await expect(endPromise).resolves.toEqual({ endpoint: 'test-endpoint', start: 1 });
        });

        it('should emit cleared event on Cleared message', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Cleared',
                        endpoint: 'test-endpoint',
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            const clearPromise = firstValueFrom(service.cleared);
            subject.next(message);
            await promise;
            await expect(clearPromise).resolves.toBe('test-endpoint');
        });

        it('should emit progress event on Progress message', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Progress',
                        endpoint: 'test-endpoint',
                        start: 1,
                        progress: 50,
                        shellCount: 10,
                        submodelCount: 20,
                    },
                ],
            } satisfies WebSocketData;

            const promise = firstValueFrom(subject);
            subject.next(message);
            await promise;
            expect(service.progress()).toEqual({
                endpoint: 'test-endpoint',
                start: 1,
                progress: 50,
                shellCount: 10,
                submodelCount: 20,
            });
        });
    });

    describe('clearIndex', () => {
        it('should clear the index for a specific endpoint', async () => {
            const endpoint = 'test-endpoint';
            const promise = lastValueFrom(service.clearIndex(endpoint));
            app.tick();
            controller.expectOne(`api/v1/index/${encodeBase64Url(endpoint)}/clear-index`).flush(null);
            await app.whenStable();
            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe('startUpdateIndex', () => {
        it('should start the update index process for a specific endpoint', async () => {
            const endpoint = 'test-endpoint';
            const promise = lastValueFrom(service.startUpdateIndex(endpoint));
            app.tick();
            controller.expectOne(`api/v1/endpoints/${encodeBase64Url(endpoint)}/start-scan`).flush(null);
            await app.whenStable();
            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe('cancelUpdateIndex', () => {
        it('should cancel the update index process for a specific endpoint', async () => {
            const endpoint = 'test-endpoint';
            const promise = lastValueFrom(service.cancelUpdateIndex(endpoint));
            app.tick();
            controller.expectOne(`api/v1/endpoints/${encodeBase64Url(endpoint)}/cancel-scan`).flush(null);
            await app.whenStable();
            await expect(promise).resolves.toBeUndefined();
        });
    });

    describe('getUpdateStatus', () => {
        it('should fetch the scan status of a specific endpoint', async () => {
            const endpoint = 'test-endpoint';
            const expectedResponse: UpdateIndexStatus = {
                name: 'test-endpoint',
                status: 'scanning',
                start: 1234567890,
            };

            const promise = lastValueFrom(service.getUpdateStatus(endpoint));
            app.tick();
            controller.expectOne(`/api/v1/endpoints/${encodeBase64Url(endpoint)}/status`).flush(expectedResponse);
            await app.whenStable();
            await expect(promise).resolves.toEqual(expectedResponse);
        });
    });
});
