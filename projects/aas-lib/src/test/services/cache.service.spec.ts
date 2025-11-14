/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CacheService } from '../../lib/services/cache.service';

describe('CacheService', () => {
    let service: CacheService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
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

        it('clears the cache', () => {
            service.clear();
            expect(service.get('http://the/answer/to/all/questions')).toBeUndefined();
        });
    });
});
