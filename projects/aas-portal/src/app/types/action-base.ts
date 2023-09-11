/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Action } from "@ngrx/store";

export abstract class ActionBase implements Action {
    constructor(type: string) {
        this.type = type;
    }

    /** The action type. */
    public readonly type: string;

    /** The error when the action fails. */
    public error: any = null;
}