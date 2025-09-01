/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import upperFirst from 'lodash-es/upperFirst';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';

import {
    aas,
    AASDocument,
    getAbbreviation,
    getChildren,
    getConceptDescription,
    getSemanticId,
    isFile,
    isReference,
} from 'aas-core';

import { ConceptDescriptionComponent } from '../concept-description/concept-description.component';
import { EndpointsApi } from '../../services/endpoints-api';
import { getUrl, isLangString, referenceToString } from '../../utilities';
import { BrowserData, BrowserElement, BrowserElementRef, BrowserProperty, BrowserState } from './browser.state';
import { ChildComponent } from '../child-component';

const collectionNames: Record<string, string> = {
    SubmodelElementCollection: 'value',
    SubmodelElementList: 'value',
    Submodel: 'submodelElements',
    AssetAdministrationShell: 'submodels',
    Entity: 'statements',
    AnnotatedRelationshipElement: 'annotations',
    Operation: 'in-/inout-/outputVariables',
};

const ignore = new Set(['parent', 'methodId', 'objectId', 'nodeId']);

@Component({
    selector: 'fhg-browser',
    templateUrl: './browser.component.html',
    styleUrl: './browser.component.scss',
    providers: [BrowserState],
    imports: [RouterLink, NgbPaginationModule, ConceptDescriptionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent extends ChildComponent<BrowserData, BrowserState> {
    private readonly api = inject(EndpointsApi);

    public constructor() {
        super();

        effect(() => {
            const env = this.document()?.content;
            if (env) {
                const aas = env.assetAdministrationShells.at(0);
                const current = aas ? this.createElement(aas) : null;
                this.state().update({ env, current, path: [] });
            } else {
                this.state().update({
                    env: {
                        assetAdministrationShells: [],
                        conceptDescriptions: [],
                        submodels: [],
                    },
                    current: null,
                    path: [],
                });
            }
        });
    }

    public readonly document = input<AASDocument | null | undefined>(undefined);

    public override readonly state = input.required<BrowserState>();

    public readonly path = computed(() => this.state().path());

    public readonly current = computed(() => this.state().current());

    public readonly properties = computed(() => this.current()?.properties ?? []);

    public readonly collection = computed(() => this.current()?.collection);

    public readonly children = computed(() => this.current()?.children ?? []);

    public readonly conceptDescription = computed(() => this.current()?.conceptDescription);

    public goUp(element: BrowserElement): void {
        const path = this.path();
        const index = path.indexOf(element);
        const newPath = path.slice(0, index);
        this.state().update({ path: newPath, current: element });
    }

    public goDown(element: BrowserElementRef): void {
        const current = this.current();
        if (!current) {
            return;
        }

        this.state().update({ path: [...this.path(), current], current: this.createElement(element.referable) });
    }

    private createElement(referable: aas.Referable): BrowserElement {
        const semanticId = getSemanticId(referable);
        const env = untracked(this.state().env);
        return {
            name: referable.idShort,
            referable,
            conceptDescription: semanticId ? getConceptDescription(env, semanticId) : undefined,
            properties: this.createProperties(referable),
            collection: upperFirst(collectionNames[referable.modelType]),
            children: getChildren(referable, env).map(child => ({
                name: child.idShort,
                abbreviation: getAbbreviation(child.modelType) ?? '',
                referable: child,
            })),
        };
    }

    private createProperties(referable: aas.Referable): BrowserProperty[] {
        const properties: BrowserProperty[] = [];
        for (const [key, value] of Object.entries(referable)) {
            if (ignore.has(key)) {
                continue;
            }

            properties.push(...this.createProperty(referable, key, value));
        }

        return properties.sort((a, b) => a.name.localeCompare(b.name));
    }

    private createProperty(referable: aas.Referable, name: string, value: unknown): BrowserProperty[] {
        name = upperFirst(name);
        if (typeof value === 'string') {
            if (isFile(referable) && name === 'Value') {
                return [{ name, value, kind: 'url', url: getUrl(this.document()!, referable) }];
            }

            return [{ name, value, kind: 'text' }];
        }

        if (isReference(value)) {
            let kind: 'text' | 'link' = 'text';
            const id = referenceToString(value);
            if (name === 'SemanticId') {
                const env = untracked(this.state().env);
                if (env.conceptDescriptions.some(cd => cd.id === id)) {
                    kind = 'link';
                }
            }

            return [{ name, value: id, kind }];
        }

        if (isLangString(value)) {
            return [
                {
                    name,
                    value: value.map(item => `[${item.language}] ${item.text}`).join(', '),
                    kind: 'text',
                },
            ];
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            const items: BrowserProperty[] = [];
            for (const [k, v] of Object.entries(value as object)) {
                items.push(...this.createProperty(referable, `${name}.${upperFirst(k)}`, v));
            }

            return items;
        }

        return [];
    }
}
