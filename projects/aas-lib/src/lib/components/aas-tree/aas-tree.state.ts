/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Injectable, signal } from '@angular/core';
import { AASTreeNode } from './aas-tree-node';
import { ChildState } from '../../child-state';

export type AASTreeData = {
    document: { endpoint?: string; id?: string };
    expanded: boolean;
    matchIndex: number;
    contents: AASTreeNode[];
    nodes: AASTreeNode[];
};

const initialState: AASTreeData = {
    document: {},
    expanded: false,
    matchIndex: 0,
    contents: [],
    nodes: [],
};

/** 
 * Represents the state of the AASTree component. 
 */
@Injectable()
export class AASTreeState extends ChildState<AASTreeData> {
    private readonly document$ = signal(initialState.document);
    private readonly expanded$ = signal(initialState.expanded);
    private readonly matchIndex$ = signal(initialState.matchIndex);
    private readonly tree$ = signal({ contents: initialState.contents, nodes: initialState.nodes });

    public constructor() {
        super(initialState);
    }

    public readonly document = this.document$.asReadonly();
    public readonly expanded = this.expanded$.asReadonly();
    public readonly matchIndex = this.matchIndex$.asReadonly();
    public readonly contents = computed(() => this.tree$().contents);
    public readonly nodes = computed(() => this.tree$().nodes);

    protected updating(newState: Partial<AASTreeData>): AASTreeData {
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

        return {
            document: this.document$(),
            expanded: this.expanded$(),
            matchIndex: this.matchIndex$(),
            contents: this.contents(),
            nodes: this.nodes(),
        };
    }

    protected initializing(state: AASTreeData | undefined): void {
        state = state ?? initialState;
        this.document$.set(state.document);
        this.expanded$.set(state.expanded);
        this.matchIndex$.set(state.matchIndex);
        this.tree$.set({ contents: state.contents, nodes: state.nodes });
    }
}
