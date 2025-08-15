/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const activateViewGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);

    if (state.url !== '/views') {
      return true;
    }

    const url = sessionStorage.getItem('ActiveViewUrl');
    if (!url) {
        return false;
    }

    return router.parseUrl(url);
};