/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { IdentityProviderClient } from './identity-provider-client.js';
import { Variable } from '../variable.js';
import { FileSystemIdentityProvider } from './file-system-identity-provider.js';
import { MongoDBIdentityProvider } from './mongo-db-identity-provider.js';
import { OicdClient } from './oicd-client.js';

export class IdentityProviderFactory {
    private static instance: IdentityProviderClient;

    public static getInstance(c: DependencyContainer): IdentityProviderClient {
        if (!IdentityProviderFactory.instance) {
            const value = c.resolve(Variable).IDENTITY_PROVIDER;
            if (!value || value.startsWith('file:')) {
                IdentityProviderFactory.instance = c.resolve(FileSystemIdentityProvider);
            } else if (value.startsWith('mongodb:')) {
                IdentityProviderFactory.instance = c.resolve(MongoDBIdentityProvider);
            } else if (value.startsWith('https:') || value.startsWith('http:')) {
                IdentityProviderFactory.instance = c.resolve(OicdClient);
            } else {
                throw new Error(`Unknown identity provider: ${value}`);
            }
        }

        return IdentityProviderFactory.instance;
    }
}
