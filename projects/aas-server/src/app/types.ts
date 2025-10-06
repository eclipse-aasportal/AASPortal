/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** The Websocket data. */
export type WebSocketData = {
    /** The message type. */
    type: string;
    /** The data. */
    data: unknown;
};

/** JSON web token private claim. */
export type JWTPayload = {
    /** user identifier (email) */
    sub?: string;
    /** user name */
    name?: string;
    /** expiration */
    exp?: number;
    /** not used */
    iat?: number;
    /** The roles that the user has. */
    roles?: string[];
};

export type PackageDescription = {
    aasIds?: string[];
    packageId: string;
};

export interface HTMLDocumentElement extends HTMLElement {
    _nsMap: { [key: string]: string };
}

export type FileResult = {
    filename: string;
    readable: NodeJS.ReadableStream;
    size?: number;
    contentType?: string;
};

/**
 * Represents the current position in the tabel.
 * - if previous and next are undefined, this indicates that the cursor is at the beginning.
 * - if previous and or next are `null`, this indicates that the cursor is at the end.
 */
export type Cursor = {
    previous?: string | null;
    next?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListenerFn = (...args: any[]) => void;

export type Stats = {
    packages: number;
    shells: number;
    submodels: number;
    conceptDescriptions: number;
};

/** The Level modifier indicates the depth of the structure of the response or input content. */
export type LevelModifier = 'deep' | 'core';

/** The Extent modifier indicates to which extent the response or input content is being serialized. */
export type ExtentModifier = 'withBlobValue' | 'withoutBlobValue';
