/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import capitalize from 'lodash-es/capitalize.js';

export type UserRole = 'reader' | 'editor' | 'admin' | undefined;

export const priority: UserRole[] = ['reader', 'editor', 'admin'];

/** The user roles. */
export const USER_ROLES: Record<string, string> = {
    admin: 'admin',
    editor: 'editor',
    reader: 'reader',
};

/** The user profile. */
export interface UserProfile {
    /** A valid e-mail address of the user. */
    id: string;
    /** The name or alias of the user. */
    name: string;
    /** The password. */
    password?: string;
}

/**  The credentials. */
export interface Credentials {
    /** A unique identifier (e-mail). */
    id: string;
    /** The password. */
    password: string;
}

/** Result of a login or profile update message. */
export interface AuthResult {
    token: string;
}

/** JSON web token private claim. */
export interface JWTPayload {
    sub?: string;
    name?: string;
    role: UserRole;
    exp?: number;
    iat?: number;
}

/**
 * Extracts a user name from the specified e-mail.
 * @param email The e-mail.
 * @returns The user name.
 */
export function getUserNameFromEMail(email: string): string {
    let name: string;
    const index = email.indexOf('@');
    if (index > 0) {
        name = email
            .substring(0, index)
            .replace(/[.-]/, ' ')
            .split(' ')
            .map(item => capitalize(item))
            .join(' ');
    } else {
        name = email;
    }

    return name;
}

/**
 * Determines whether the current user is authorized for the specified roles.
 * @param actual The actual role.
 * @param expected The expected roles.
 */
export function isUserAuthorized(actual: UserRole, expected: UserRole[]): boolean {
    return expected.indexOf(actual) >= 0;
}
