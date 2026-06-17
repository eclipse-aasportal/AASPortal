/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import crypto from 'crypto';
import { InjectionToken } from 'tsyringe';

export const API_KEY_HANDLER: InjectionToken<ApiKeyHandler> = 'API_KEY_HANDLER';

export type ApiKeyRecord = {
    key: string;
    label: string;
    rules: string | Record<string, unknown>;
    createdAt: string;
};

/**
 * Abstract base class for API key lifecycle operations.
 *
 * Provides a secure key generator and defines contracts for creating,
 * retrieving, and revoking API keys. Implementations should persist keys
 * securely and enforce associated rules.
 */
export abstract class ApiKeyHandler {
    /**
     * Generates a new cryptographically secure random API key.
     *
     * @returns {string} A 64-character hexadecimal string representing the generated API key.
     */
    public generateKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Creates a new API key record.
     * @param label The label for the key.
     * @param rules The rules associated with the key.
     * @returns The created API key.
     */
    public abstract create(label: string, rules: string | Record<string, unknown>): Promise<string>;

    /**
     * Gets an API key record by its key.
     * @param key The API key.
     * @returns The API key record or undefined if not found.
     */
    public abstract get(key: string): Promise<ApiKeyRecord | undefined>;

    /**
     * Revokes an API key.
     * @param key The API key to revoke.
     * @returns True if the key was revoked, false if the key was not found.
     */
    public abstract revokeKey(key: string): Promise<boolean>;
}
