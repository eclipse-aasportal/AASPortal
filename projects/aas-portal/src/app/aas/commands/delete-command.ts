/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
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
} from 'common';

import { cloneDeep, noop } from 'lodash-es';
import { Store } from '@ngrx/store';
import { State } from '../aas.state';
import * as AASActions from '../aas.actions';
import { Command } from '../../types/command';

export class DeleteCommand extends Command {
    private readonly store: Store<State>;
    private readonly elements: aas.Referable[];
    private readonly memento: AASDocument;
    private document: AASDocument;

    public constructor(store: Store, document: AASDocument, elements: aas.Referable | aas.Referable[]) {
        super('Delete');

        if (!document.content) {
            throw new Error('Document content is undefined.');
        }

        this.store = store as Store<State>;
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

        this.store.dispatch(AASActions.applyDocument({ document: this.document }));
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
        this.store.dispatch(AASActions.applyDocument({ document: this.memento }));
    }

    protected onRedo(): void {
        this.store.dispatch(AASActions.applyDocument({ document: this.document }));
    }

    protected onAbort(): void {
        noop();
    }
}