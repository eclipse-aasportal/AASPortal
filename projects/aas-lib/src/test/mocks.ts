/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

export class FakeLoader extends TranslateLoader {
    override getTranslation(lang: string): Observable<TranslationObject> {
        return of({});
    }
}