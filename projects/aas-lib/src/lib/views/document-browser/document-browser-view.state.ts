/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { noop } from 'aas-core';
import { BrowserState } from '../../components/browser/browser.state';
import { CompositeViewData, CompositeViewState } from '../composite-view-state';

export type DocumentBrowserData = CompositeViewData;

const initialState: DocumentBrowserData = {
    tuples: [],
};

@Injectable({
    providedIn: 'root',
})
/**
 * `DocumentBrowserState` manages the state for the `DocumentBrowserView`.
 * It extends `CompositeViewState` and holds the `BrowserState` instance.
 */
export class DocumentBrowserViewState extends CompositeViewState<DocumentBrowserData> {
    public constructor() {
        super(initialState);
    }

    /**
     * The `BrowserState` instance used by the `BrowserComponent` to manage the browsing state.
     */
    public readonly browserState = new BrowserState();

    protected override updating(newState: Partial<DocumentBrowserData>): void {
        noop(newState);
    }
}
