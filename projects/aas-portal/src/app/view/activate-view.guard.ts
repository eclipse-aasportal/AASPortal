/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ViewState } from './view.state';

/**
 * Guards whether the View page can be activated. The View page can be activated if the current
 * URL addresses a specific view or if a previous view is available.
 * @param route The current activated route.
 * @param state The current router state.
 * @returns `true`, `false` or an redirection.
 */
export const activateViewGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const viewState = inject(ViewState);

    if (state.url !== '/views') {
        return true;
    }

    const path = viewState.activeView()?.path;
    if (!path) {
        return false;
    }

    return router.parseUrl(`/views/${path}`);
};
