/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, Type } from '@angular/core';
import { ViewRoute } from 'aas-lib';

import { ViewState } from '../../app/view/view.state';

describe('ViewState', () => {
    let service: ViewState;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideZonelessChangeDetection()],
        });

        service = TestBed.inject(ViewState);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('has an activeView property with initial value "null"', () => {
        expect(service.activeView()).toBeNull();
    });

    it('allows updating the state', () => {
        const activeView: ViewRoute = {
            path: 'Browser',
            component: {} as Type<unknown>,
            data: {
                type: 'Default',
            },
        };

        service.update({ activeView });
        expect(service.activeView()).toEqual(activeView);
    });
});
