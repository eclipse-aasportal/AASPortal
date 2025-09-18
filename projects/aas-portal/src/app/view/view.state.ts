/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { ViewRoute } from 'aas-lib';

export type ViewData = {
    activeView: ViewRoute | null;
};

const initialState: ViewData = {
    activeView: null,
};

/**
 * Represents the current state of the View page.
 */
@Injectable({
    providedIn: 'root',
})
export class ViewState {
    private readonly viewState$ = signal(initialState.activeView);

    /** The route configuration of the current active view. */
    public readonly activeView = this.viewState$.asReadonly();

    /**
     * Updates the state.
     * @param newState The new state.
     */
    public update(newState: Partial<ViewData>): void {
        if (newState.activeView !== undefined) {
            this.viewState$.set(newState.activeView);
        }
    }
}
