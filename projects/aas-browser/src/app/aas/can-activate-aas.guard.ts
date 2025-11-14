/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AASApi } from './aas-api';

export const canActivateAASGuard: CanActivateFn = route => {
    const api = inject(AASApi);
    let aasId: string | null | undefined = route.paramMap.get('aasId');
    if (aasId !== null && aasId !== ':aasId') {
        return true;
    }

    aasId = api.aasId();
    return aasId !== undefined && aasId !== ':aasId';
};
