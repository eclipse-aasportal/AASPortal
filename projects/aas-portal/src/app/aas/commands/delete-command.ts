/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    aas,
    AASDocument,
    getChildren,
    getParent,
    isAssetAdministrationShell,
    isSubmodel,
    normalize,
    selectSubmodel,
    noop,
} from 'aas-core';

import cloneDeep from 'lodash-es/cloneDeep';
import { Command } from '../../types/command';
import { AASStore } from '../aas.store';

export class DeleteCommand extends Command {
    private readonly elements: aas.Referable[];
    private readonly memento: AASDocument;
    private document: AASDocument;

    public constructor(
        private readonly store: AASStore,
        document: AASDocument,
        elements: aas.Referable | aas.Referable[],
    ) {
        super('Delete');

        if (!document.content) {
            throw new Error('Document content is undefined.');
        }

        this.memento = document;
        this.document = {
            ...document,
            content: {
                ...document.content!,
                assetAdministrationShells: [...document.content!.assetAdministrationShells],
                submodels: [...document.content!.submodels],
            },
        };

        this.elements = Array.isArray(elements) ? normalize(document.content, elements, item => item) : [elements];
    }

    protected onExecute(): void {
        const env = this.document.content!;
        const map = new Map<aas.Submodel, aas.Referable[]>();
        for (const element of this.elements) {
            if (isAssetAdministrationShell(element)) {
                throw new Error('Invalid operation.');
            } else if (isSubmodel(element)) {
                const index = env.submodels.indexOf(element);
                env.submodels.splice(index, 1);
                this.deleteFromShells(element);
            } else {
                const submodel = selectSubmodel(env, element)!;
                let list = map.get(submodel);
                if (!list) {
                    list = [];
                    map.set(submodel, list);
                }

                list.push(element);
            }
        }

        for (const item of map) {
            const submodel = item[0];
            const index = env.submodels.indexOf(submodel);
            env.submodels[index] = cloneDeep(submodel);
            for (const element of item[1]) {
                const parent = getParent(env, element)!;
                const children = getChildren(parent);
                const index = children.findIndex(child => child.idShort === element.idShort);
                children.splice(index, 1);
            }
        }

        this.store.document$.set({ ...this.document, modified: true });
    }

    private deleteFromShells(element: aas.Submodel) {
        const env = this.document.content!;
        env.assetAdministrationShells.forEach((shell, i) => {
            if (shell.submodels) {
                const j = shell.submodels.findIndex(r => r.keys[0].value === element.id);
                if (j >= 0) {
                    shell = { ...env.assetAdministrationShells[i] };
                    env.assetAdministrationShells[i] = shell;
                    shell.submodels = shell.submodels?.filter((_, k) => k !== j);
                }
            }
        });
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
}
