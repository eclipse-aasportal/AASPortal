/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { Command } from '../../types/command';
import {
    aas,
    AASDocument,
    getChildren,
    isAssetAdministrationShell,
    isEnvironment,
    isSubmodel,
    isSubmodelElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
    noop,
} from 'aas-core';

import { AASStore } from '../aas.store';

export class NewElementCommand extends Command {
    private readonly memento: AASDocument;
    private document: AASDocument;
    private content: aas.Environment;

    public constructor(
        private readonly store: AASStore,
        document: AASDocument,
        private readonly parent: aas.Referable,
        private readonly element: aas.Referable | aas.Environment,
    ) {
        super('New Element');

        if (!document || !document.content) {
            throw new Error('Invalid document.');
        }

        const children = getChildren(parent, document.content);
        if (!children) {
            throw new Error('Argument parent is invalid.');
        }

        this.memento = document;
        this.content = {
            assetAdministrationShells: [...document.content.assetAdministrationShells],
            submodels: [...document.content.submodels],
            conceptDescriptions: [...document.content.conceptDescriptions],
        };

        this.document = { ...document, content: this.content };
        this.parent = parent;
        this.element = element;
    }

    protected onExecute(): void {
        if (isEnvironment(this.element)) {
            const submodel = this.element.submodels[0];
            this.insertSubmodel(submodel);

            for (const conceptDescription of this.element.conceptDescriptions) {
                this.insertConceptDescription(conceptDescription);
            }
        } else if (isSubmodel(this.element)) {
            this.insertSubmodel(this.element);
        } else if (isSubmodelElement(this.element)) {
            this.insertSubmodelElement(this.element);
        } else {
            throw new Error('Invalid operation.');
        }

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

    private insertSubmodel(submodel: aas.Submodel): void {
        if (!isAssetAdministrationShell(this.parent)) {
            throw new Error('Invalid operation.');
        }

        if (this.content.submodels.some(item => item.id === submodel.id)) {
            throw new Error(`A submodel with the identifier "${submodel.id}" already exists.`);
        }

        this.content.submodels.push(submodel);
        const shell = this.content.assetAdministrationShells[0];
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

        this.content.assetAdministrationShells[0] = { ...shell, submodels };
    }

    private insertSubmodelElement(element: aas.SubmodelElement) {
        const sourceSubmodel = this.getSubmodel(this.parent);
        const index = this.content.submodels.indexOf(sourceSubmodel);
        const targetSubmodel = cloneDeep(sourceSubmodel);
        this.content.submodels[index] = targetSubmodel;

        const parentReference = this.createReference(this.parent);
        const value = this.getTargetValue(targetSubmodel, parentReference);
        element.parent = parentReference;
        value.push(element);
    }

    private insertConceptDescription(conceptDescription: aas.ConceptDescription): void {
        if (this.content.conceptDescriptions.every(item => item.id !== conceptDescription.id)) {
            this.content.conceptDescriptions.push(conceptDescription);
        }
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

    private getTargetValue(submodel: aas.Submodel, target: aas.Reference): aas.SubmodelElementCollection[] {
        let referable: aas.Referable | undefined = submodel;
        if (!submodel.submodelElements) {
            submodel.submodelElements = [];
        }

        let children: aas.SubmodelElement[] | undefined = submodel.submodelElements;
        for (let i = 1, n = target.keys.length; i < n; i++) {
            const key = target.keys[i];
            referable = children?.find(item => item.idShort === key.value);
            if (isSubmodelElementCollection(referable) || isSubmodelElementList(referable)) {
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
