/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { CacheService } from '../../lib/services/cache.service';
import { IndexChangeService } from '../../lib/services/index-change.service';
import { WebSocketData } from 'projects/aas-core/dist/types';

describe('CacheService', () => {
    let service: CacheService;
    let indexChange: jasmine.SpyObj<IndexChangeService>;
    let message = new Subject<WebSocketData>();

    beforeEach(() => {
        indexChange = jasmine.createSpyObj<IndexChangeService>(['clear'], { message: message.asObservable() });

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: IndexChangeService,
                    useValue: indexChange,
                },
            ],
        });

        service = TestBed.inject(CacheService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('get', () => {
        beforeEach(() => {
            service.set('http://the/answer/to/all/questions', 42);
        });

        it('returns "undefined"', () => {
            expect(service.get('unknown')).toBeUndefined();
        });

        it('returns "42"', () => {
            expect(service.get('http://the/answer/to/all/questions')).toBe(42);
        });
    });

    describe('set', () => {
        it('sets a new value', () => {
            expect(service.get('http://the/answer/to/all/questions')).toBeUndefined();
            service.set('http://the/answer/to/all/questions', 42);
            expect(service.get('http://the/answer/to/all/questions')).toBe(42);
        });

        it('updates an existing value', () => {
            service.set('http://the/answer/to/all/questions', 42);
            expect(service.get('http://the/answer/to/all/questions')).toBe(42);
            service.set('http://the/answer/to/all/questions', 43);
            expect(service.get('http://the/answer/to/all/questions')).toBe(43);
        });
    });

    describe('clear', () => {
        beforeEach(() => {
            service.set('http://the/answer/to/all/questions', 42);
        });

        it('clears the cache if the IndexChangeService receives a message', (done: DoneFn) => {
            message.subscribe(() => {
                expect(service.get('http://the/answer/to/all/questions')).toBeUndefined();
                done();
            });

            message.next({ type: 'AnyMessage', data: 42 } satisfies WebSocketData);
        });
    });
});
