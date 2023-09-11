/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, selectReferable } from 'common';
import { cloneDeep, noop } from 'lodash-es';
import { Command } from 'src/app/types/command';
import { Store } from '@ngrx/store';
import { State } from '../aas.state';
import * as AASActions from '../aas.actions';

export class UpdateElementCommand extends Command {
    private readonly store: Store<State>;
    private readonly origin: aas.SubmodelElement;
    private readonly element: aas.SubmodelElement;
    private readonly memento: AASDocument;
    private document: AASDocument;

    constructor(
        store: Store<State>,
        document: AASDocument,
        origin: aas.SubmodelElement,
        element: aas.SubmodelElement) {
        super('SetValue');

        this.store = store;
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
        this.store.dispatch(AASActions.applyDocument({ document: this.document }));
    }

    protected onUndo(): void {
        this.store.dispatch(AASActions.applyDocument({ document: this.memento }));
    }

    protected onRedo(): void {
        this.store.dispatch(AASActions.applyDocument({ document: this.document }));
    }

    protected onAbort(): void {
        noop();
    }

    private getChildren(document: AASDocument, element: aas.SubmodelElement): aas.SubmodelElementCollection[] {
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
        }

        if (!children) {
            throw new Error(`Invalid operation.`);
        }

        return children;
    }
}