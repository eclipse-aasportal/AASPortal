/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InputSignal } from '@angular/core';

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

export interface StartTileComponent {
    endpoint: InputSignal<string>;
    id: InputSignal<string>;
}

export enum ViewMode {
    Undefined = '',
    List = 'list',
    Tree = 'tree',
}
