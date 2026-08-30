/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, afterEach, describe, vi, it, expect } from 'vitest';
import { container } from 'tsyringe';
import { SessionStoreFactory } from './session-store-factory.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { SessionStore } from './session-store.js';

describe('SessionStoreFactory', () => {
    let factory: SessionStoreFactory;
    let variable: Variable;

    beforeEach(() => {
        container.clearInstances();
        container.registerSingleton(SessionStoreFactory);
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { SESSION_STORE: 'mongodb://localhost:27017/test' }),
        );

        variable = container.resolve(Variable);
        factory = container.resolve(SessionStoreFactory);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return undefined if SESSION_STORE is not set', () => {
        vi.spyOn(variable, 'SESSION_STORE', 'get').mockReturnValue(undefined);
        const result = factory.getInstance();
        expect(result).toBeUndefined();
    });

    it('should create a SessionStore instance if SESSION_STORE is set to a valid MongoDB URL', () => {
        vi.spyOn(variable, 'SESSION_STORE', 'get').mockReturnValue('mongodb://localhost:27017/test');
        vi.spyOn(container, 'resolve').mockReturnValue(createSpyObj<SessionStore>([]));
        const result = factory.getInstance();
        expect(container.resolve).toHaveBeenCalledWith(SessionStore);
        expect(result).toBeDefined();
    });
});
