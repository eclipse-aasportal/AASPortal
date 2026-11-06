/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { ApiKeyHandler } from './api-key-handler.js';
import { Variable } from '../variable.js';
import { LocalApiKeyHandler } from './local-api-key-handler.js';
import { MongoDBApiKeyManager } from './mongodb-api-key-handler.js';

export class ApiKeyHandlerFactory {
    private static instance: ApiKeyHandler;

    public static getInstance(c: DependencyContainer): ApiKeyHandler {
        if (!ApiKeyHandlerFactory.instance) {
            const value = c.resolve(Variable).API_KEY_HANDLER;
            if (!value || value.startsWith('file:')) {
                ApiKeyHandlerFactory.instance = c.resolve(LocalApiKeyHandler);
            } else if (value.startsWith('mongodb')) {
                ApiKeyHandlerFactory.instance = c.resolve(MongoDBApiKeyManager);
            } else {
                throw new Error(`Unknown cookie storage: ${value}`);
            }
        }

        return ApiKeyHandlerFactory.instance;
    }
}
