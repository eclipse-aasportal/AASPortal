/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AASState } from './aas.state';

export const activateAASGuard: CanActivateFn = (route, state) => {  
    if (state.url === '/aas') {
        const componentState = inject(AASState);
        return componentState.document() !== null;
    }

    return true;
};
