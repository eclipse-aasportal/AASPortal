/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, EndpointType } from "common";

export class AASTableRow {
    constructor(
        public readonly document: AASDocument,
        public readonly selected: boolean,
        public readonly name: string,
        public readonly id: string,
        public readonly type: EndpointType,
        public readonly expanded: boolean,
        public readonly isLeaf: boolean,
        public readonly level: number,
        public firstChild: number,
        public nextSibling: number) {
    }

    public get hasChildren(): boolean {
        return this.firstChild >= 0;
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
    initialized: boolean;
    isFirstPage: boolean;
    isLastPage: boolean;
    rows: AASTableRow[];
}

export interface AASTableFeatureState {
    aasTable: AASTableState;
}
