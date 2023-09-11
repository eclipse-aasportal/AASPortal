/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'common';
import { Observable } from 'rxjs';

export interface AASTree {
    selectedElements: Observable<aas.Referable[]>;
    findNext(): void;
    findPrevious(): void;
}