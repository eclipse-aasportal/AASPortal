/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';

import { ClipboardService } from '../lib/clipboard.service';

describe('ClipboardService', () => {
    let clipboard: ClipboardService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        clipboard = TestBed.inject(ClipboardService);
    });

    it('should be created', () => {
        expect(clipboard).toBeTruthy();
    });

    it('can store multiple formats', function () {
        clipboard.set('number', 42);
        clipboard.set('string', 'Hello World!');
        expect(clipboard.contains('number')).toBeTrue();
        expect(clipboard.contains('string')).toBeTrue();
        expect(clipboard.get('number')).toEqual(42);
        expect(clipboard.get('string')).toEqual('Hello World!');
    });

    it('gets undefined for unknown format', function () {
        expect(clipboard.get('unknown')).toBeUndefined();
    });

    it('overwrites an existing format', function () {
        clipboard.set('number', 42);
        expect(clipboard.get('number')).toEqual(42);
        clipboard.set('number', 1);
        expect(clipboard.get('number')).toEqual(1);
    });

    it('can clear a specific format', function () {
        clipboard.set('number', 42);
        clipboard.set('string', 'Hello World!');
        clipboard.clear('number');
        expect(clipboard.contains('number')).toBeFalse();
        expect(clipboard.contains()).toBeTrue();
    });

    it('can clear the clipboard', function () {
        clipboard.set('number', 42);
        clipboard.set('string', 'Hello World!');
        clipboard.clear();
        expect(clipboard.contains('number')).toBeFalse();
        expect(clipboard.contains('string')).toBeFalse();
        expect(clipboard.contains()).toBeFalse();
    });
});