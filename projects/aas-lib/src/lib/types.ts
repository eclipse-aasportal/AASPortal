/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export interface AASQueryParams {
    format?: string;
    id?: string;
}

/** Environment variables */
export interface Environment {
    production: boolean;
    version: string;
    homepage: string;
    author: string;
}

export interface MessageEntry {
    header?: string;
    text: string;
    delay: number;
    autohide: boolean;
    classname?: string;
}

export type OnlineState = 'offline' | 'online';

export enum ViewMode {
    Undefined = '',
    List = 'list',
    Tree = 'tree',
}

/** Represents an item of a data sheet. */
export interface DataSheetItem {
    /** The unique language independant name. */
    idShort: string;
    /** The display name in the current language. */
    displayName: string;
    /** The display value in the current language inclusive unit if exist. */
    value: string | string[] | undefined;
    /** The description in the current language. */
    description?: string;
    /** */
    url?: string;
}

