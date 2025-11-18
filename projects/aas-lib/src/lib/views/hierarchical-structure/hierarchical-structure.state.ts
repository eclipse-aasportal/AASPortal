/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { aas, AASDocument } from 'aas-core';

export type ArcheType = 'Full' | 'OneDown' | 'OneUp';

export type TreeNode = {
    archeType: ArcheType;
    id: string;
    level: number;
    name: string;
    abbreviation: string;
    node: aas.Entity;
    expanded: boolean;
    highlighted: boolean;
    loaded: boolean;
    isLeaf: boolean;
    hasChildren: boolean;
    document?: AASDocument | null;
    thumbnail?: string;
};

export type TreeItem = [aas.Entity | null, TreeNode];

export type Tree = TreeItem[];

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
    private readonly tree$ = signal(initialState.tree);

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
