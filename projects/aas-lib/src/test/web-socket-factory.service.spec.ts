/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { WebSocketData } from 'common';
import { WebSocketSubject } from 'rxjs/webSocket';

import { WebSocketFactoryService } from '../lib/web-socket-factory.service';

describe('WindowService', () => {
    let service: WebSocketFactoryService;
    let webSocket: WebSocketSubject<WebSocketData>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(WebSocketFactoryService);
    });

    afterEach(function(){
        webSocket?.unsubscribe();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('creates a new WebSocket connection', function () {
        webSocket = service.create("http://localhost:8888");
        expect(webSocket).toBeTruthy();
    });
});