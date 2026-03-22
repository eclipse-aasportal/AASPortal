/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** Environment variables */
export interface Environment {
    production: boolean;
    version: string;
    homepage: string;
    author: string;
    basePath: string;
    port: string;
}

/**
 * Represents the current position in the table.
 * - if previous and next are undefined, this indicates that the cursor is at the beginning.
 * - if previous and or next are `null`, this indicates that the cursor is at the end.
 */
export type Cursor = {
    previous: string | null | undefined;
    next: string | null | undefined;
};

export interface Stats {
    packages: number;
    shells: number;
    submodels: number;
    conceptDescriptions: number;
}
