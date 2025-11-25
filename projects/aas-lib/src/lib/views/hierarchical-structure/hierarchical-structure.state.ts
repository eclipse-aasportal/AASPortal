/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { Tree } from '../../components/tree/tree.component';

export type ArcheType = 'Full' | 'OneDown' | 'OneUp';

export type HierarchicalStructureData = {
    tree: Tree;
};

const initialState: HierarchicalStructureData = {
    tree: [],
};

/**
 * Manages the state for a hierarchical structure component.
 *
 * @property tree - A read-only signal representing the current hierarchical tree data.
 *
 * @method update - Updates the hierarchical tree data if provided in the new state.
 *
 * @param newState - A partial state object containing updated hierarchical structure data.
 */
@Injectable()
export class HierarchicalStructureState {
    private readonly tree$ = signal(initialState.tree, {
        equal: (a, b) => {
            if (a === b) {
                return true;
            }

            if (a.length !== b.length) {
                return false;
            }

            for (let i = 0, n = a.length; i < n; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }

            return true;
        },
    });

    /**
     * An observable that provides a read-only view of the hierarchical structure tree.
     */
    public readonly tree = this.tree$.asReadonly();

    /**
     * Updates the hierarchical structure state with the provided partial data.
     *
     * @param newState - A partial object containing properties of `HierarchicalStructureData` to update.
     */
    public update(newState: Partial<HierarchicalStructureData>): void {
        if (newState.tree !== undefined) {
            this.tree$.set(newState.tree);
        }
    }
}
