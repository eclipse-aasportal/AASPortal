/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, afterEach, describe, Mocked, vi, it, expect } from 'vitest';
import { DependencyContainer } from 'tsyringe';
import mongoose from 'mongoose';
import { LOGGER, Logger, MongoDBConnectionProvider } from 'aas-package';
import { SessionStoreFactory } from './session-store-factory';
import { createSpyObj } from '../../test/mocks';
import { Variable } from '../variable';

describe('SessionStoreFactory', () => {
    let mockDependencyContainer: Mocked<DependencyContainer>;

    beforeEach(() => {
        mockDependencyContainer = createSpyObj<DependencyContainer>(['resolve']);
        SessionStoreFactory['instance'] = undefined;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return undefined if SESSION_STORE is not set', () => {
        mockDependencyContainer.resolve.mockImplementation((token: unknown) => {
            if (token === Variable) {
                return { SESSION_STORE: undefined };
            } else if (token === MongoDBConnectionProvider) {
                return {
                    getConnection: vi.fn().mockReturnValue({}),
                };
            } else if (token === LOGGER) {
                return createSpyObj<Logger>(['info', 'error']);
            }

            return undefined;
        });

        const result = SessionStoreFactory.getInstance(mockDependencyContainer);
        expect(result).toBeUndefined();
    });

    it('should create a SessionStore instance if SESSION_STORE is set to a valid MongoDB URL', () => {
        mockDependencyContainer.resolve.mockImplementation((token: unknown) => {
            if (token === Variable) {
                return { SESSION_STORE: 'mongodb://localhost:27017/test' };
            } else if (token === MongoDBConnectionProvider) {
                return {
                    getConnection: vi.fn().mockReturnValue(createSpyObj<mongoose.Connection>([], { model: vi.fn() })),
                };
            } else if (token === LOGGER) {
                return createSpyObj<Logger>(['info', 'error']);
            }

            return undefined;
        });

        const result = SessionStoreFactory.getInstance(mockDependencyContainer);
        expect(result).toBeDefined();
    });

    it('should throw an error for an unknown session store URL', () => {
        mockDependencyContainer.resolve.mockImplementation((token: unknown) => {
            if (token === Variable) {
                return { SESSION_STORE: 'unknown://localhost' };
            } else if (token === MongoDBConnectionProvider) {
                return {
                    getConnection: vi.fn().mockReturnValue(createSpyObj<mongoose.Connection>([], { model: vi.fn() })),
                };
            } else if (token === LOGGER) {
                return createSpyObj<Logger>(['info', 'error']);
            }

            return undefined;
        });

        expect(() => SessionStoreFactory.getInstance(mockDependencyContainer)).toThrow(
            'Unknown session store: unknown://localhost',
        );
    });
});
