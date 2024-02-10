/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'common';
import { ViewMode } from '../types/view-mode';

export class AASTableRow {
    public constructor(
        public readonly document: AASDocument,
        public readonly selected: boolean,
        public readonly expanded: boolean,
        public readonly isLeaf: boolean,
        public readonly level: number,
        public firstChild: number,
        public nextSibling: number,
    ) {}

    public get id(): string {
        return this.document.id;
    }

    public get name(): string {
        return this.document.idShort;
    }

    public get thumbnail(): string {
        return this.document.thumbnail ?? '/assets/resources/aas.32.png';
    }

    public get endpoint(): string {
        return this.document.endpoint;
    }

    public get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    public get state(): 'loaded' | 'unloaded' | 'unavailable' {
        if (this.document.content === null) {
            return 'unloaded';
        }

        if (this.document.content) {
            return 'loaded';
        }

        return 'unavailable';
    }

    public getChildren(rows: AASTableRow[]): AASTableRow[] {
        const children: AASTableRow[] = [];
        if (this.firstChild >= 0) {
            let child = rows[this.firstChild];
            children.push(child);
            while (child.nextSibling >= 0) {
                child = rows[child.nextSibling];
                children.push(child);
            }
        }

        return children;
    }

    public getExpanded(rows: AASTableRow[]): AASTableRow[] {
        return this.traverse(rows, this, [this]);
    }

    private traverse(rows: AASTableRow[], row: AASTableRow, expanded: AASTableRow[]): AASTableRow[] {
        if (row.firstChild >= 0 && row.expanded) {
            let child = rows[row.firstChild];
            expanded.push(child);
            this.traverse(rows, child, expanded);
            while (child.nextSibling >= 0) {
                child = rows[child.nextSibling];
                expanded.push(child);
                this.traverse(rows, child, expanded);
            }
        }

        return expanded;
    }
}

export interface AASTableState {
    viewMode: ViewMode;
    rows: AASTableRow[];
}

export interface AASTableFeatureState {
    aasTable: AASTableState;
}
