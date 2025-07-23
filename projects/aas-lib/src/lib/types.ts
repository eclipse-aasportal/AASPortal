/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';

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

/** Defines options for an item in the data sheet. */
export type DataSheetItemOptions = {
    /** The idShort path to a root element. */
    idShortPath?: string;
    /** Resolves the URL if the value of an item represents an URL. */
    getUrl?: GetUrlFn;
} & (
    | { type: 'url'; getUrl: GetUrlFn }
    | {
          type: 'format';
          /** The format string like `{FirstName} {LastName}`. */
          format: string;
      }
    | {
          type: 'join';
          /** The idShortPaths of the referables that values should be joined. */
          join: string[];
          /**  A string used to separate one element of the array from the next in the resulting string. */
          separator: string;
      }
);

export type GetUrlFn = (element: aas.Referable) => string | undefined;

export type DataSheetItemPath = string | DataSheetItemOptions;

/** Represents an item of a data sheet. */
export interface DataSheetItem {
    /** The unique language independent name. */
    idShort: string;
    /** The display name in the current language. */
    displayName: string;
    /** The display value in the current language inclusive unit if exist. */
    value: string | string[] | undefined;
    /** The description in the current language. */
    description?: string;
    /** A resource URL.*/
    url?: string;
}

export interface DataSheetData {
    name?: string;
    level?: number;
    items: DataSheetItem[];
}
