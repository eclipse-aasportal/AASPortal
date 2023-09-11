/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    public getElementById(elementId: string): HTMLElement | null {
        return document.getElementById(elementId);
    }
    
    public createElement(tagName: string, options?: ElementCreationOptions): HTMLElement {
        return document.createElement(tagName, options);
    }
}