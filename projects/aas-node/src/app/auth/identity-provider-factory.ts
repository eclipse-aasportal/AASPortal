/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { IdentityProviderClient } from './identity-provider-client.js';
import { Variable } from '../variable.js';
import { OidcClient } from './oidc-client.js';
import { IdentityProvider } from './identity-provider.js';

@singleton()
export class IdentityProviderFactory {
    private static instance: IdentityProviderClient;

    public getInstance(): IdentityProviderClient {
        if (!IdentityProviderFactory.instance) {
            const value = container.resolve(Variable).IDENTITY_PROVIDER;
            if (value.startsWith('https:') || value.startsWith('http:')) {
                IdentityProviderFactory.instance = container.resolve(OidcClient);
            } else {
                IdentityProviderFactory.instance = container.resolve(IdentityProvider);
            }
        }

        return IdentityProviderFactory.instance;
    }
}
