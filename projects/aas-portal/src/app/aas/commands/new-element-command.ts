/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { cloneDeep, noop } from 'lodash-es';
import { Command } from '../../types/command';
import { Store } from '@ngrx/store';
import {
    aas,
    AASDocument,
    getChildren,
    isAssetAdministrationShell,
    isSubmodel,
    isSubmodelElement,
    isSubmodelElementCollection,
} from 'common';

import { AASState } from '../aas.state';
import * as AASActions from '../aas.actions';

export class NewElementCommand extends Command {
    private readonly store: Store<{ aas: AASState }>;
    private readonly parent: aas.Referable;
    private readonly element: aas.Referable;
    private readonly memento: AASDocument;
    private document: AASDocument;

    public constructor(store: Store, document: AASDocument, parent: aas.Referable, element: aas.Referable) {
        super('New Element');

        if (!document || !document.content) {
            throw new Error('Invalid document.');
        }

        const children = getChildren(parent, document.content);
        if (!children) {
            throw new Error('Argument parent is invalid.');
        }

        this.store = store as Store<{ aas: AASState }>;
        this.memento = document;
        this.document = {
            ...document,
            content: {
                ...document.content!,
                assetAdministrationShells: [...document.content!.assetAdministrationShells],
                submodels: [...document.content!.submodels],
            },
        };

        this.parent = parent;
        this.element = element;
    }

    protected onExecute(): void {
        if (isSubmodel(this.element) && isAssetAdministrationShell(this.parent)) {
            this.insertSubmodel(this.element);
        } else if (isSubmodelElement(this.element)) {
            this.insertSubmodelElement(this.element);
        } else {
            throw new Error('Invalid operation.');
        }

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

    private insertSubmodel(submodel: aas.Submodel): void {
        const children = this.document.content!.submodels;
        children.push(submodel);

        let shell = this.document.content!.assetAdministrationShells[0];
        const submodels = shell.submodels ? [...shell.submodels] : [];
        submodels.push({
            type: 'ModelReference',
            keys: [
                {
                    type: 'Submodel',
                    value: submodel.id,
                },
            ],
        });

        shell = { ...shell, submodels };
        this.document.content!.assetAdministrationShells[0] = shell;
    }

    private insertSubmodelElement(element: aas.SubmodelElement) {
        const sourceSubmodel = this.getSubmodel(this.parent);
        const parentReference = this.createReference(this.parent);
        const index = this.document.content!.submodels.indexOf(sourceSubmodel);
        const targetSubmodel = cloneDeep(sourceSubmodel);
        this.document.content!.submodels[index] = targetSubmodel;
        const children = this.getTargetChildren(targetSubmodel, parentReference);
        element.parent = parentReference;
        children.push(element);
    }

    private getSubmodel(referable: aas.Referable): aas.Submodel {
        let submodel: aas.Submodel | undefined;
        if (isSubmodel(referable)) {
            submodel = referable;
        } else {
            if (!referable.parent || referable.parent.keys[0].type !== 'Submodel') {
                throw new Error('Invalid argument referable.');
            }

            const id = referable.parent.keys[0].value;
            submodel = this.document.content?.submodels.find(item => item.id === id);
        }

        if (!submodel) {
            throw new Error('Invalid argument referable.');
        }

        return submodel;
    }

    private getTargetChildren(submodel: aas.Submodel, target: aas.Reference): aas.SubmodelElementCollection[] {
        let referable: aas.Referable | undefined = submodel;
        if (!submodel.submodelElements) {
            submodel.submodelElements = [];
        }

        let children: aas.SubmodelElement[] | undefined = submodel.submodelElements;
        for (let i = 1, n = target.keys.length; i < n; i++) {
            const key = target.keys[i];
            referable = children?.find(item => item.idShort === key.value);
            if (isSubmodelElementCollection(referable)) {
                if (!referable.value) {
                    referable.value = [];
                }

                children = referable.value;
            } else {
                throw new Error('Invalid operation.');
            }
        }

        return children;
    }
}