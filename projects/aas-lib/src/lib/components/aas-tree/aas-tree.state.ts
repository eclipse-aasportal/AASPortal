/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, inject, Injectable, signal } from '@angular/core';
import { AASDocument } from 'aas-core';
import { AASTreeNode } from './aas-tree-node';
import { ChildState } from '../child-state';
import { TranslateService } from '@ngx-translate/core';

export type AASTreeData = {
    document: AASDocument | null;
    expanded: boolean;
    matchIndex: number;
    contents: AASTreeNode[];
    nodes: AASTreeNode[];
};

const initialState: AASTreeData = {
    document: null,
    expanded: false,
    matchIndex: 0,
    contents: [],
    nodes: [],
};

/**
 * Represents the state handler of the AASTree component.
 */
@Injectable()
export class AASTreeState extends ChildState {
    private readonly document$ = signal(initialState.document);
    private readonly expanded$ = signal(initialState.expanded);
    private readonly matchIndex$ = signal(initialState.matchIndex);
    private readonly tree$ = signal({ contents: initialState.contents, nodes: initialState.nodes });

    public constructor() {
        super(inject(TranslateService));
    }

    public readonly document = this.document$.asReadonly();

    public readonly expanded = this.expanded$.asReadonly();

    public readonly matchIndex = this.matchIndex$.asReadonly();

    public readonly contents = computed(() => this.tree$().contents);

    public readonly nodes = computed(() => this.tree$().nodes);

    public update(newState: Partial<AASTreeData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.expanded !== undefined) {
            this.expanded$.set(newState.expanded);
        }

        if (newState.matchIndex !== undefined) {
            this.matchIndex$.set(newState.matchIndex);
        }

        if (newState.contents || newState.nodes) {
            this.tree$.update(state => ({
                contents: newState.contents ?? state.contents,
                nodes: newState.nodes ?? state.nodes,
            }));
        }
    }
}
