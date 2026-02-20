/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASDocument,
    getReferable,
    getSemanticId,
    getUnit,
    isSubmodelElementCollection,
    isSubmodelElementList,
    parseNumber,
} from 'aas-core';

import { CARBON_FOOTPRINT_0_9, CARBON_FOOTPRINT_1_0 } from '../views-constants';
import { createDataSheet, findSubmodel } from '../../utilities';
import { DataSheetData } from '../../types';
import { ChildState } from '../../components/child-state';

export type CarbonFootprintData = {
    document: AASDocument | null;
    submodel: aas.Submodel | null;
    index: number;
    totalPcfCO2eq: string;
    items: DataSheetData[];
};

const initialState: CarbonFootprintData = {
    document: null,
    submodel: null,
    index: 1,
    totalPcfCO2eq: '',
    items: [
        {
            collapsed: false,
            items: [],
        },
    ],
};

/**
 * The state of the Carbon Footprint component.
 */
@Injectable()
export class CarbonFootprintState extends ChildState {
    private readonly document$ = signal(initialState.document);
    private readonly submodel$ = signal(initialState.submodel);
    private readonly index$ = signal(initialState.index);
    private readonly totalPcfCO2eq$ = signal(initialState.totalPcfCO2eq);
    private readonly items$ = signal(initialState.items);

    public constructor() {
        super(inject(TranslateService));

        effect(() => {
            const document = this.document$();
            if (!document) {
                return;
            }

            const submodel = findSubmodel(document, [CARBON_FOOTPRINT_1_0, CARBON_FOOTPRINT_0_9]);
            if (!submodel) {
                return;
            }

            this.update({ submodel });
        });

        effect(() => {
            const submodel = this.submodel();
            if (!submodel) {
                return;
            }

            this.update({ totalPcfCO2eq: this.getTotalPcfCO2eq(submodel), items: this.createItems(submodel) });
        });

        effect(() => {
            this.currentLang();
            const submodel = untracked(this.submodel);
            if (!submodel) {
                return;
            }

            this.update({ totalPcfCO2eq: this.getTotalPcfCO2eq(submodel), items: this.createItems(submodel) });
        });
    }

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** The current active "Carbon Footprint" submodel. */
    public readonly submodel = this.submodel$.asReadonly();

    /** The index of the current active carbon footprint item. */
    public readonly index = this.index$.asReadonly();

    /** The total product carbon footprint. */
    public readonly totalPcfCO2eq = this.totalPcfCO2eq$.asReadonly();

    /** The carbon footprint items. */
    public readonly items = this.items$.asReadonly();

    private getTotalPcfCO2eq(submodel: aas.Submodel): string {
        const env = untracked(this.document)?.content;
        if (!env || !submodel) {
            return '-';
        }

        const semanticId = getSemanticId(submodel);
        return semanticId === CARBON_FOOTPRINT_0_9
            ? this.totalPcfCO2eq_0_9(env, submodel)
            : this.totalPcfCO2eq_1_0(env, submodel);
    }

    public update(newState: Partial<CarbonFootprintData>): void {
        if (newState.index !== undefined) {
            this.index$.set(newState.index);
        }

        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.submodel !== undefined) {
            this.submodel$.set(newState.submodel);
        }

        if (newState.totalPcfCO2eq !== undefined) {
            this.totalPcfCO2eq$.set(newState.totalPcfCO2eq);
        }

        if (newState.items !== undefined) {
            this.items$.set(newState.items);
        }
    }

    private createItems(submodel: aas.Submodel): DataSheetData[] {
        const semanticId = getSemanticId(submodel);
        const items: DataSheetData[] = [];
        if (!submodel) {
            return items;
        }

        return semanticId === CARBON_FOOTPRINT_0_9
            ? this.createCarbonFootprints_0_9(submodel)
            : this.createCarbonFootprints_1_0(submodel);
    }

    private totalPcfCO2eq_0_9(env: aas.Environment, submodel: aas.Submodel): string {
        if (!submodel.submodelElements) {
            return '-';
        }

        let total = 0.0;
        let unit: string | undefined;
        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && sme.value && getSemanticId(sme) === CARBON_FOOTPRINT_0_9) {
                const pcfCO2eq = getReferable<aas.Property>(sme, 'PCFCO2eq');
                if (pcfCO2eq?.value) {
                    const value = parseNumber(pcfCO2eq.value);
                    if (!isNaN(value)) {
                        total += value;
                    }

                    if (!unit) {
                        unit = getUnit(env, pcfCO2eq);
                    }
                }
            }
        }

        return `${total.toLocaleString(this.translate.getCurrentLang())} ${unit}`;
    }

    private totalPcfCO2eq_1_0(env: aas.Environment, submodel: aas.Submodel): string {
        const productCarbonFootprints = getReferable(submodel, 'ProductCarbonFootprints');
        if (!isSubmodelElementList(productCarbonFootprints) || !productCarbonFootprints.value) {
            return '-';
        }

        let total = 0.0;
        let unit: string | undefined;
        for (const productCarbonFootprint of productCarbonFootprints.value) {
            if (isSubmodelElementCollection(productCarbonFootprint)) {
                const pcfCO2eq = getReferable<aas.Property>(productCarbonFootprint, 'PcfCO2eq');
                if (pcfCO2eq?.value) {
                    const value = parseNumber(pcfCO2eq.value);
                    if (!isNaN(value)) {
                        total += value;
                    }

                    if (!unit) {
                        unit = getUnit(env, pcfCO2eq);
                    }
                }
            }
        }

        return `${total.toLocaleString(this.translate.getCurrentLang())} ${unit}`;
    }

    private createCarbonFootprints_0_9(submodel: aas.Submodel): DataSheetData[] {
        const dataSheets: DataSheetData[] = [];
        if (!submodel.submodelElements) {
            return dataSheets;
        }

        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && sme.value && getSemanticId(sme) === CARBON_FOOTPRINT_0_9) {
                dataSheets.push(this.createCarbonFootprint_0_9(sme));
            }
        }

        return dataSheets;
    }

    private createCarbonFootprints_1_0(submodel: aas.Submodel): DataSheetData[] {
        const dataSheets: DataSheetData[] = [];
        const productCarbonFootprints = getReferable(submodel, 'ProductCarbonFootprints');
        if (!isSubmodelElementList(productCarbonFootprints) || !productCarbonFootprints.value) {
            return dataSheets;
        }

        for (const productCarbonFootprint of productCarbonFootprints.value) {
            if (isSubmodelElementCollection(productCarbonFootprint) && productCarbonFootprint.value) {
                dataSheets.push(this.createCarbonFootprint_1_0(productCarbonFootprint));
            }
        }

        return dataSheets;
    }

    private createCarbonFootprint_1_0(productCarbonFootprint: aas.SubmodelElementCollection): DataSheetData {
        return createDataSheet(untracked(this.document)!, productCarbonFootprint, this.translate.getCurrentLang(), {
            type: 'A',
            include: [
                'PcfCO2eq',
                'ReferenceImpactUnitForCalculation',
                'QuantityOfMeasureForCalculation',
                'LifeCyclePhases',
                'PcfCalculationMethods',
                'PublicationDate',
                'ExpirationDate',
                'ExplanatoryStatement',
                {
                    type: 'format',
                    idShortPath: 'GoodsHandoverAddress',
                    format: '{Street} {HouseNumber}, {Country}-{ZipCode} {CityTown}',
                },
            ],
        });
    }

    private createCarbonFootprint_0_9(productCarbonFootprint: aas.SubmodelElementCollection): DataSheetData {
        return createDataSheet(untracked(this.document)!, productCarbonFootprint, this.translate.getCurrentLang(), {
            type: 'A',
            include: [
                'PCFCO2eq',
                'PCFReferenceValueForCalculation',
                'PCFQuantityOfMeasureForCalculation',
                'PCFLifeCyclePhase',
                'PublicationDate',
                'ExpirationDate',
                'ExplanatoryStatement',
                {
                    type: 'format',
                    idShortPath: 'GoodsHandoverAddress',
                    format: '{Street} {HouseNumber}, {Country}-{ZipCode} {CityTown}',
                },
            ],
        });
    }
}
