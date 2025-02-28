/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, selectReferable, noop } from 'aas-core';
import cloneDeep from 'lodash-es/cloneDeep';
import { Command } from '../../types/command';
import { AASStore } from '../aas.store';

export class UpdateElementCommand extends Command {
    private readonly origin: aas.SubmodelElement;
    private readonly element: aas.SubmodelElement;
    private readonly memento: AASDocument;
    private document: AASDocument;

    public constructor(
        private readonly store: AASStore,
        document: AASDocument,
        origin: aas.SubmodelElement,
        element: aas.SubmodelElement,
    ) {
        super('SetValue');

        this.document = this.memento = document;
        this.origin = origin;
        this.element = element;
    }

    protected onExecute(): void {
        this.document = cloneDeep(this.memento);
        const sourceCollection = this.getChildren(this.memento, this.origin);
        const targetCollection = this.getChildren(this.document, this.origin);
        const index = sourceCollection.indexOf(this.origin);
        targetCollection[index] = this.element;
        this.store.document$.set({ ...this.document, modified: true });
    }

    protected onUndo(): void {
        this.store.document$.set({ ...this.memento, modified: true });
    }

    protected onRedo(): void {
        this.store.document$.set({ ...this.document, modified: true });
    }

    protected onAbort(): void {
        noop();
    }

    private getChildren(document: AASDocument, element: aas.SubmodelElement): aas.SubmodelElement[] {
        if (!element.parent) {
            throw new Error(`${element.idShort} is not referable.`);
        }

        const parent = selectReferable(document.content!, element.parent);
        if (!parent) {
            throw new Error(`Invalid parent reference.`);
        }

        let children: aas.SubmodelElement[] | undefined;
        if (parent.modelType === 'Submodel') {
            children = (parent as aas.Submodel).submodelElements;
        } else if (parent.modelType === 'SubmodelElementCollection') {
            children = (parent as aas.SubmodelElementCollection).value;
        } else if (parent.modelType === 'SubmodelElementList') {
            children = (parent as aas.SubmodelElementList).value;
        } else if (parent.modelType === 'Entity') {
            children = (parent as aas.Entity).statements;
        } else if (parent.modelType === 'AnnotatedRelationshipElement') {
            children = (parent as aas.AnnotatedRelationshipElement).annotations;
        }

        if (!children) {
            throw new Error(`Invalid operation.`);
        }

        return children;
    }
}
