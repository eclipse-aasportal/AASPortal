/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';
import { noop } from 'aas-core';
import { ApiKeyHandler, ApiKeyRecord } from './api-key-handler.js';

@singleton()
export class LocalApiKeyHandler extends ApiKeyHandler {
    public override create(label: string, rules: string | Record<string, unknown>): Promise<string> {
        noop(label, rules);
        return Promise.resolve('not-a-key');
    }

    public override get(key: string): Promise<ApiKeyRecord | undefined> {
        noop(key);
        return Promise.resolve({
            key: '',
            label: '',
            rules: '',
            createdAt: '',
        });
    }

    public override revokeKey(key: string): Promise<boolean> {
        noop(key);
        return Promise.resolve(true);
    }
}
