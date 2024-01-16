/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, isSubmodel } from 'common';
import { resolveSemanticId, supportedSubmodelTemplates } from '../submodel-template/submodel-template';

export class AASTreeRow {
    public constructor(
        public readonly id: string,
        public readonly element: aas.Referable,
        public expanded: boolean,
        public selected: boolean,
        public readonly highlighted: boolean,
        public readonly level: number,
        public readonly abbreviation: string,
        public readonly name: string,
        public readonly typeInfo: string,
        public readonly value: string | boolean | undefined,
        public readonly displayType: DisplayType,
        public readonly isLeaf: boolean,
        public readonly parent: number,
        public firstChild: number,
        public nextSibling: number,
    ) {}

    public get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    public get hasSemantic(): boolean {
        const referable = this.element;
        if (isSubmodel(referable)) {
            const sematicId = resolveSemanticId(referable);
            return sematicId != null && supportedSubmodelTemplates.has(sematicId);
        }

        return false;
    }

    public getChildren(rows: AASTreeRow[]): AASTreeRow[] {
        const children: AASTreeRow[] = [];
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

    public getExpanded(rows: AASTreeRow[]): AASTreeRow[] {
        return this.traverse(rows, this, [this]);
    }

    private traverse(rows: AASTreeRow[], row: AASTreeRow, expanded: AASTreeRow[]): AASTreeRow[] {
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

export enum DisplayType {
    undefined = '',
    Text = 'text',
    Boolean = 'boolean',
    Url = 'url',
}

export interface SearchTerm {
    text?: string;
    query?: SearchQuery;
}

export type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export interface SearchQuery {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

export interface AASTreeState {
    rows: AASTreeRow[];
    index: number;
    terms: SearchTerm[];
    error: unknown;
}

export interface AASTreeFeatureState {
    tree: AASTreeState;
}
