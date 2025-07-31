/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import upperFirst from 'lodash-es/upperFirst';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';

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
import { RouterLink } from '@angular/router';

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

export interface BrowserProperty {
    name: string;
    value: string;
    url?: string;
    kind: 'text' | 'link' | 'url';
}

export interface BrowserElementRef {
    name: string;
    abbreviation: string;
    referable: aas.Referable;
}

export interface BrowserElement {
    name: string;
    referable: aas.Referable;
    conceptDescription?: aas.ConceptDescription;
    collection?: string;
    properties: BrowserProperty[];
    children: BrowserElementRef[];
}

export interface BrowserItem {
    smId: string;
    idShortPath: string;
    property: string;
}

@Component({
    selector: 'fhg-browser',
    templateUrl: './browser.component.html',
    styleUrl: './browser.component.scss',
    imports: [RouterLink, NgbPaginationModule, ConceptDescriptionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent {
    private readonly path$ = signal<BrowserElement[]>([]);
    private readonly conceptDescription$ = signal<aas.ConceptDescription | null>(null);
    private readonly env = signal<aas.Environment>({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
    });

    public constructor(private readonly api: EndpointsApi) {
        effect(() => {
            const env = this.document()?.content;
            if (!env || env.assetAdministrationShells.length === 0) {
                this.current.set(undefined);
                this.env.set({
                    assetAdministrationShells: [],
                    submodels: [],
                    conceptDescriptions: [],
                });

                return;
            }

            this.env.set(env);
            this.current.set(this.createElement(env.assetAdministrationShells[0]));
        });
    }

    public readonly document = input<AASDocument | null | undefined>(undefined);

    public readonly open = output<BrowserItem>();

    public readonly path = this.path$.asReadonly();

    public readonly current = signal<BrowserElement | undefined>(undefined);

    public readonly properties = computed(() => this.current()?.properties ?? []);

    public readonly collection = computed(() => this.current()?.collection);

    public readonly children = computed(() => this.current()?.children ?? []);

    public readonly conceptDescription = computed(() => this.current()?.conceptDescription);

    private get idShortPath(): string {
        const current = this.current()?.referable;
        if (current === undefined) {
            return '';
        }

        const path = this.path$();
        if (path.length < 3) {
            return '';
        }

        let idShortPath = '';
        for (let i = 2, n = path.length; i < n; i++) {
            idShortPath += path[i].referable.idShort + '.';
        }

        return idShortPath + current.idShort;
    }

    public goUp(element: BrowserElement): void {
        const index = this.path$().indexOf(element);
        this.path$.update(state => state.slice(0, index));
        this.current.set(element);
    }

    public goDown(element: BrowserElementRef): void {
        const current = this.current();
        if (current === undefined) {
            return;
        }

        this.path$.update(state => [...state, current]);
        this.current.set(this.createElement(element.referable));
    }

    private createElement(referable: aas.Referable): BrowserElement {
        const semanticId = getSemanticId(referable);
        return {
            name: referable.idShort,
            referable,
            conceptDescription: semanticId ? getConceptDescription(untracked(this.env), semanticId) : undefined,
            properties: this.createProperties(referable),
            collection: upperFirst(collectionNames[referable.modelType]),
            children: getChildren(referable, untracked(this.env)).map(child => ({
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
                if (untracked(this.env).conceptDescriptions.some(cd => cd.id === id)) {
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
