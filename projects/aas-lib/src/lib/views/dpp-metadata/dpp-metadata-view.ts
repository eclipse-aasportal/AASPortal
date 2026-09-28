/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgComponentOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { Component, computed, effect, inject, OnDestroy, TemplateRef, Type, viewChild } from '@angular/core';

import {
    aas,
    getSemanticId,
    isProperty,
    isReferenceElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
} from 'aas-core';

import { ViewRouteName } from '../../types';
import { findRouteForSubmodel, toString } from '../../utilities';
import { ToolbarService } from '../../shared/services/toolbar.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { SubmodelTree } from '../../components/submodel-tree/submodel-tree';
import { LoadingSpinner } from '../../components/loading-spinner/loading-spinner';
import { Nameplate } from '../nameplate/nameplate';
import { CarbonFootprint } from '../carbon-footprint/carbon-footprint';
import { HandoverDocumentation } from '../handover-documentation/handover-documentation';
import { ContactInformation } from '../contact-information/contact-information';
import { TechnicalData } from '../technical-data/technical-data';
import { HierarchicalStructure } from '../hierarchical-structure/hierarchical-structure';
import { LeafView } from '../leaf-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { CONTENT_SPECIFICATION_IDS_1 } from '../views-constants';
import { DppMetadataViewState } from './dpp-metadata-view.state';

/** A dedicated view component embeddable for a given Leaf route, plus how to build its inputs. */
type EmbeddableView = {
    component: Type<unknown>;
    inputs: (submodel: aas.Submodel) => Record<string, unknown>;
};

/** One submodel referenced by contentSpecificationIds, paired with the embeddable view (if any)
 *  that matches its semanticId -- undefined view means no dedicated component exists for it, and
 *  the generic SubmodelTree is used instead. */
export type ContentSubmodel = {
    submodel: aas.Submodel;
    view: EmbeddableView | undefined;
};

@Component({
    selector: 'fhg-dpp-metadata-view',
    templateUrl: './dpp-metadata-view.html',
    styleUrl: './dpp-metadata-view.scss',
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'DppMetadata' }],
    imports: [ThumbnailQRCode, TranslateDirective, RouterLink, SubmodelTree, NgComponentOutlet, LoadingSpinner],
})
export class DppMetadataView extends LeafView implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly state = inject(DppMetadataViewState);

    /**
     * Maps a Leaf route's path to the embeddable component that renders it and the inputs it
     * needs -- the single place to touch when a new submodel type gets a dedicated view: add a
     * key here, no template changes required.
     */
    private readonly embeddableViews: Partial<Record<ViewRouteName, EmbeddableView>> = {
        Nameplate: { component: Nameplate, inputs: () => ({ document: this.document(), state: this.nameplateState }) },
        CarbonFootprint: {
            component: CarbonFootprint,
            inputs: () => ({ document: this.document(), state: this.carbonFootprintState }),
        },
        HandoverDocumentation: {
            component: HandoverDocumentation,
            inputs: () => ({ document: this.document(), state: this.handoverDocumentationState }),
        },
        ContactInformation: {
            component: ContactInformation,
            inputs: () => ({ document: this.document(), state: this.contactInformationState }),
        },
        TechnicalData: {
            component: TechnicalData,
            inputs: () => ({ document: this.document(), state: this.technicalDataState }),
        },
        HierarchicalStructure: {
            component: HierarchicalStructure,
            inputs: submodel => ({ document: this.document(), submodel }),
        },
    };

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    private readonly nameplateState = this.state.nameplateState;

    private readonly carbonFootprintState = this.state.carbonFootprintState;

    private readonly handoverDocumentationState = this.state.handoverDocumentationState;

    private readonly contactInformationState = this.state.contactInformationState;

    private readonly technicalDataState = this.state.technicalDataState;

    /**
     * Leaf route paths that must come first, in this exact order; anything else keeps whatever
     * order it appeared in contentSpecificationIds (Array.prototype.sort is stable).
     */
    private static readonly priorityOrder: ViewRouteName[] = ['Nameplate', 'CarbonFootprint', 'TechnicalData'];

    /**
     * The semanticIds listed in this submodel's contentSpecificationIds element -- i.e. every
     * submodel the DPP is supposed to have, whether or not it was actually found.
     */
    private readonly requestedSemanticIds = computed<string[]>(() => {
        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return [];
        }

        const listElement = submodel.submodelElements.find(
            element => getSemanticId(element) === CONTENT_SPECIFICATION_IDS_1,
        );

        return this.extractSemanticIds(listElement);
    });

    /**
     * The submodels listed in this submodel's contentSpecificationIds element (matched against
     * the current AAS's own submodels by semanticId), each paired with its embeddable view if
     * one exists, and sorted per {@link priorityOrder}. A requested semanticId that matches no
     * submodel in this AAS is silently omitted here -- see {@link dppComplete}.
     */
    public readonly contentSubmodels = computed<ContentSubmodel[]>(() => {
        const allSubmodels = this.document()?.content?.submodels;
        if (!allSubmodels) {
            return [];
        }

        const result: { item: ContentSubmodel; priority: number }[] = [];
        for (const semanticId of this.requestedSemanticIds()) {
            const match = allSubmodels.find(item => getSemanticId(item) === semanticId);
            if (match) {
                const route = findRouteForSubmodel(this.viewRoutes, match, false);
                const priority = route ? DppMetadataView.priorityOrder.indexOf(route.path) : -1;
                result.push({
                    item: { submodel: match, view: route ? this.embeddableViews[route.path] : undefined },
                    priority: priority < 0 ? DppMetadataView.priorityOrder.length : priority,
                });
            }
        }

        return result.sort((a, b) => a.priority - b.priority).map(({ item }) => item);
    });

    /** True once every submodel listed in contentSpecificationIds was actually found in this AAS. */
    public readonly dppComplete = computed<boolean>(() => {
        const requested = this.requestedSemanticIds();
        return requested.length > 0 && this.contentSubmodels().length === requested.length;
    });

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }

    /**
     * Looks up a value inside the DppMetadata submodel itself by idShort, e.g.
     * `getMetadataValue('UniqueProductIdentifier')` -- or a dot-separated idShort path for a
     * value nested inside a SubmodelElementCollection/List, e.g. `getMetadataValue('Foo.0.Bar')`.
     * @param idShortPath The idShort, or dot-separated idShort path, of the element to read.
     * @param defaultValue Returned if the submodel isn't loaded yet or the element doesn't exist.
     */
    public getMetadataValue(idShortPath: string, defaultValue = '-'): string {
        const submodel = this.submodel();
        if (!submodel) {
            return defaultValue;
        }

        return toString(submodel, idShortPath, this.currentLang(), this.document()?.content, defaultValue);
    }

    /** Reads the referenced semanticId out of each entry of a contentSpecificationIds-like list,
     *  whether it's stored as a plain string Property or a ReferenceElement. */
    private extractSemanticIds(element: aas.SubmodelElement | undefined): string[] {
        if (!element) {
            return [];
        }

        const children =
            isSubmodelElementList(element) || isSubmodelElementCollection(element) ? (element.value ?? []) : [];

        const semanticIds: string[] = [];
        for (const child of children) {
            if (isProperty(child) && child.value) {
                semanticIds.push(child.value);
            } else if (isReferenceElement(child) && child.value?.keys?.length) {
                semanticIds.push(child.value.keys[child.value.keys.length - 1].value);
            }
        }

        return semanticIds;
    }
}
