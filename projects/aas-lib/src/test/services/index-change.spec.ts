/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { lastValueFrom, of, Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { WebSocketData } from 'aas-core';
import { createSpyObj, MockWebSocketService } from '../mocks';
import { WebSocketService } from '../../lib/services/web-socket.service';
import { IndexChange } from '../../lib/services/index-change';
import { AuthService } from '../../lib/core/auth/auth.service';

describe('IndexChange', () => {
    let service: IndexChange;
    let webSubject: WebSocketSubject<WebSocketData>;
    let auth: Mocked<AuthService>;
    let http: Mocked<HttpClient>;

    beforeEach(() => {
        webSubject = new Subject<WebSocketData>() as unknown as WebSocketSubject<WebSocketData>;
        auth = createSpyObj<AuthService>([], {
            ready: of(true),
        });

        http = createSpyObj<HttpClient>(['get', 'post', 'put', 'delete']);
        http.get.mockReturnValue(of({ count: 42 }));

        TestBed.configureTestingModule({
            providers: [
                IndexChange,
                {
                    provide: WebSocketService,
                    useValue: new MockWebSocketService(),
                },
                {
                    provide: HttpClient,
                    useValue: http,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
            ],
        });

        service = TestBed.inject(IndexChange);
    });

    it('should be created', () => {
        expect(service).toBeInstanceOf(IndexChange);
    });

    describe('clear', () => {
        it('should clear the state and emit reset event', async () => {
            await lastValueFrom(service.clear());
            expect(http.get).toHaveBeenCalledWith('/api/v1/endpoints/count');
            expect(http.get).toHaveBeenCalledWith('/api/v1/documents/count');
            expect(service.documentCount()).toBe(42);
            expect(service.endpointCount()).toBe(42);
            expect(service.changedDocuments()).toBe(0);
        });
    });

    describe.skip('websocket messages', () => {
        it('should update the state on AASNodeMessage', async () => {
            const message = {
                type: 'AASNodeMessage[]',
                data: [
                    {
                        type: 'Added',
                    },
                ],
            } satisfies WebSocketData;

            webSubject.next(message);
            await lastValueFrom(webSubject);
            expect(service.documentCount()).toBe(43);
            expect(service.endpointCount()).toBe(42);
            expect(service.changedDocuments()).toBe(0);
        });
    });
});
