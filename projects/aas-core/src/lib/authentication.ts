/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import capitalize from 'lodash-es/capitalize.js';

export type UserRole = 'user' | 'admin';

const priority: UserRole[] = ['user', 'admin'];

/** JSON web token private claim. */
export interface User {
    id: string;
    name: string;
}

/** User with additional session information. */
export interface SessionUser extends User {
    role: UserRole;
    client_id: string;
    session_state?: string;
    check_session_iframe?: string;
}

/** The user profile. */
export interface UserProfile {
    /** A valid e-mail address of the user. */
    id: string;
    /** The name or alias of the user. */
    name: string;
    /** The current password. */
    password?: string;
    /** The new password. */
    newPassword?: string;
}

/**
 * Determines whether the specified object is a `UserProfile` object.
 * @param obj The object to check.
 * @returns `true` if the specified object is a `UserProfile` object; otherwise, `false`.
 */
export function isUserProfile(obj: unknown): obj is UserProfile {
    return (
        typeof obj === 'object' &&
        typeof (obj as UserProfile).id === 'string' &&
        typeof (obj as UserProfile).name === 'string' &&
        (typeof (obj as UserProfile).password === 'undefined' || typeof (obj as UserProfile).password === 'string') &&
        (typeof (obj as UserProfile).newPassword === 'undefined' ||
            typeof (obj as UserProfile).newPassword === 'string')
    );
}

/**  The credentials. */
export interface Credentials {
    /** A unique identifier (e-mail). */
    id: string;
    /** The password. */
    password: string;
}

/**
 * Determines whether the specified object is a `Credentials` object.
 * @param obj The object to check.
 * @returns `true` if the specified object is a `Credentials` object; otherwise, `false`.
 */
export function isCredentials(obj: unknown): obj is Credentials {
    return (
        typeof obj === 'object' &&
        typeof (obj as Credentials).id === 'string' &&
        typeof (obj as Credentials).password === 'string'
    );
}

/** Result of a login or profile update message. */
export interface AuthResult {
    token: string;
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
 * Determines whether the current user is authorized for the specified role.
 * @param actual The actual role.
 * @param minimumRequired The minimum required role.
 */
export function isUserAuthorized(actual: UserRole | undefined, minimumRequired: UserRole | undefined): boolean {
    if (!minimumRequired) {
        return true;
    }

    if (!actual) {
        return false;
    }

    return priority.indexOf(actual) >= priority.indexOf(minimumRequired);
}
