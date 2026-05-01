/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import upperFirst from 'lodash-es/upperFirst';
import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core';
import {
    aas,
    getAbbreviation,
    getChildren,
    getConceptDescription,
    getSemanticId,
    isFile,
    isReference,
    isSubmodel,
    isSubmodelElementList,
} from 'aas-core';

import { ConceptDescriptionComponent } from '../concept-description/concept-description.component';
import { isLangString, referenceToString } from '../../utilities';
import { BrowserElement, BrowserElementRef, BrowserProperty, BrowserState } from './browser.state';
import { ChildComponent } from '../child-component';
import { API_URL } from '../../api-url';

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
    imports: [RouterLink, ConceptDescriptionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * The `BrowserComponent` displays the elements of an AAS document in a hierarchical structure.
 * It allows users to navigate through the AAS environment, view properties of elements,
 * and explore related concept descriptions and child elements.
 */
export class BrowserComponent extends ChildComponent {
    private readonly apiUrl = inject(API_URL);

    public constructor() {
        super();

        effect(() => {
            const env = this.env();
            if (env) {
                const aas = env.assetAdministrationShells.at(0);
                const current = aas ? this.createElement(aas, aas.idShort, env) : null;
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

        effect(() => {
            const endpoint = this.endpoint();
            this.state().update({ endpoint });
        });
    }

    /**
     * Input property that accepts an `Environment` to be displayed in the browser.
     * It can be null or undefined. When a new environment is provided, the component updates its state
     * to reflect the content of the document.
     */
    public readonly env = input<aas.Environment | undefined>(undefined);

    /**
     * The name of the AAS endpoint. A value is required in a multi endpoint application.
     */
    public readonly endpoint = input<string | undefined>(undefined);

    /**
     * Input signal that holds the `BrowserState` for the component. This state manages the
     * current element being displayed, the navigation path, and the overall AAS environment.
     * This input is required for the component to function correctly.
     */
    public readonly state = input.required<BrowserState>();

    /**
     * Returns the current navigation path as an array of `BrowserElement` objects.
     * The path represents the hierarchy of elements that the user has navigated through.
     */
    public readonly path = computed(() => this.state().path());

    /**
     * Returns the currently selected `BrowserElement`.
     * This element's properties and children are displayed in the component.
     */
    public readonly current = computed(() => this.state().current());

    /**
     * Returns an array of `BrowserProperty` objects for the currently selected element.
     * These properties are displayed in a list format, showing the name and value of each property.
     */
    public readonly properties = computed(() => this.current()?.properties ?? []);

    /**
     * Returns the name of the collection for the currently selected element.
     */
    public readonly collectionName = computed(() => this.current()?.collectionName);

    /**
     * Returns an array of `BrowserElementRef` objects representing the children
     * of the currently selected element. These children are displayed as links that allow the user
     * to navigate deeper into the AAS hierarchy.
     */
    public readonly children = computed(() => this.current()?.children ?? []);

    /**
     * Returns the concept description of the current element.
     */
    public readonly conceptDescription = computed(() => this.current()?.conceptDescription);

    /**
     * Navigates the browser one level up in the hierarchy.
     * @param element The `BrowserElement` to navigate up from.
     */
    public goUp(element: BrowserElement): void {
        const path = this.path();
        const index = path.indexOf(element);
        const newPath = path.slice(0, index);
        this.state().update({ path: newPath, current: element });
    }

    /**
     * Navigates the browser down to a child element.
     * @param element The `BrowserElementRef` representing the child element to navigate to.
     */
    public goDown(element: BrowserElementRef): void {
        const current = this.current();
        if (!current) {
            return;
        }

        this.state().update({
            path: [...this.path(), current],
            current: this.createElement(element.referable, element.name, untracked(this.state().env)),
        });
    }

    private createElement(referable: aas.Referable, name: string, env: aas.Environment): BrowserElement {
        const semanticId = getSemanticId(referable);
        const modelType = referable.modelType;
        return {
            name,
            referable,
            conceptDescription: semanticId ? getConceptDescription(env, semanticId) : undefined,
            properties: this.createProperties(referable),
            collectionName: upperFirst(collectionNames[referable.modelType]),
            children: getChildren(referable, env).map((child, index) => {
                let name: string;
                if (modelType === 'SubmodelElementList') {
                    name = '[' + index + ']';
                    if (child.idShort) {
                        name += ' : ' + child.idShort;
                    }
                } else {
                    name = child.idShort;
                }

                return {
                    name,
                    abbreviation: getAbbreviation(child.modelType) ?? '',
                    referable: child,
                };
            }),
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
                const aas = this.env()!.assetAdministrationShells[0];
                const submodel = isSubmodel(referable) ? referable : (this.state().path()[1].referable as aas.Submodel);
                const idShortPath = this.getIdShortPath(referable);
                return [
                    {
                        name,
                        value,
                        kind: 'url',
                        url: this.apiUrl.getFileUrl(this.endpoint(), aas.id, submodel.id, idShortPath),
                    },
                ];
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

    private getIdShortPath(referable: aas.Referable): string {
        const current = this.current()?.referable;
        if (current === undefined) {
            return '';
        }

        const path = [
            ...this.state()
                .path()
                .map(item => item.referable),
            current,
            referable,
        ];

        if (path.length < 2) {
            return '';
        }

        let parent = path[1];
        let idShortPath = '';
        for (let i = 2, n = path.length; i < n; i++) {
            const item = path[i];
            if (!idShortPath) {
                idShortPath = item.idShort;
            } else if (isSubmodelElementList(parent)) {
                idShortPath += '[' + parent.value!.indexOf(item) + ']';
            } else {
                idShortPath += '.' + item.idShort;
            }

            parent = item;
        }

        return idShortPath;
    }
}
