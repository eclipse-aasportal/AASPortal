/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { aas } from 'aas-core';

import { ChildState } from '../child-state';

export interface BrowserProperty {
    name: string;
    value: string;
    url?: string;
    kind: 'text' | 'link' | 'url';
}

export interface BrowserElementRef {
    name: string;
    abbreviation: string;
    referable: aas.Referable;
}

export interface BrowserElement {
    name: string;
    referable: aas.Referable;
    conceptDescription?: aas.ConceptDescription;
    collectionName?: string;
    properties: BrowserProperty[];
    children: BrowserElementRef[];
}

export interface BrowserItem {
    smId: string;
    idShortPath: string;
    property: string;
}

export type BrowserData = {
    env: aas.Environment;
<<<<<<< HEAD
=======
    endpoint: string | null;
>>>>>>> development
    current: BrowserElement | null;
    path: BrowserElement[];
};

const initialState: BrowserData = {
    env: {
        assetAdministrationShells: [],
        conceptDescriptions: [],
        submodels: [],
    },
<<<<<<< HEAD
=======
    endpoint: null,
>>>>>>> development
    current: null,
    path: [],
};

/**
 * State management service for the browser component.
 */
@Injectable()
export class BrowserState extends ChildState<BrowserData> {
    private readonly path$ = signal(initialState.path);
    private readonly current$ = signal(initialState.current);
    private readonly env$ = signal(initialState.env);
<<<<<<< HEAD
=======
    private readonly endpoint$ = signal(initialState.endpoint);
>>>>>>> development

    public constructor() {
        super(inject(TranslateService));
    }

    /** The current visible element. */
    public readonly current = this.current$.asReadonly();

    /** The path of the current element. */
    public readonly path = this.path$.asReadonly();

    /** The current Asset Administration Shell environment. */
    public readonly env = this.env$.asReadonly();

<<<<<<< HEAD
=======
    public readonly endpoint = this.endpoint$.asReadonly();

>>>>>>> development
    /**
     * Updates the state with the provided new state.
     * @param newState The new state to set.
     */
    public override update(newState: Partial<BrowserData>): void {
        if (newState.current !== undefined) {
            this.current$.set(newState.current);
        }

        if (newState.path !== undefined) {
            this.path$.set(newState.path);
        }

        if (newState.env !== undefined) {
            this.env$.set(newState.env);
        }
<<<<<<< HEAD
=======

        if (newState.endpoint !== undefined) {
            this.endpoint$.set(newState.endpoint);
        }
>>>>>>> development
    }
}
