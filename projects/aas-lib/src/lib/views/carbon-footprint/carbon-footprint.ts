/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeDetectionStrategy, Component, computed, input, Signal, signal, untracked } from '@angular/core';

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

import { CARBON_FOOTPRINT_0_9, CARBON_FOOTPRINT_1_0 } from '../views';
import { createDataSheet } from '../../utilities';
import { DataSheetData } from '../../types';
import { DataSheet } from '../../components/data-sheet/data-sheet';

const CarbonFootprint_0_9_Id = 'https://admin-shell.io/idta/CarbonFootprint/ProductCarbonFootprint/0/9';

@Component({
    selector: 'fhg-carbon-footprint',
    imports: [TranslateModule, NgbAccordionModule, NgbPaginationModule, DataSheet],
    templateUrl: './carbon-footprint.html',
    styleUrl: './carbon-footprint.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprint {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(translate: TranslateService) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

    public readonly document = input<AASDocument>();

    public readonly collapsed = input(true);

    public readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => {
            const semanticId = getSemanticId(submodel);
            return semanticId === CARBON_FOOTPRINT_1_0 || semanticId === CARBON_FOOTPRINT_0_9;
        });
    });

    /** The total product carbon footprint. */
    public readonly totalPcfCO2eq = computed(() => {
        const submodel = this.submodel();
        const env = this.document()?.content;
        const currentLang = this.currentLang();
        if (!env || !submodel) {
            return '-';
        }

        return this.semanticId() === CARBON_FOOTPRINT_0_9
            ? this.totalPcfCO2eq_0_9(env, submodel, currentLang)
            : this.totalPcfCO2eq_1_0(env, submodel, currentLang);
    });

    /** The available carbon footprints of a product. */
    public readonly carbonFootprintItems = computed(() => {
        const submodel = this.submodel();
        const currentLang = this.currentLang();
        const semanticId = untracked(this.semanticId);
        const items: DataSheetData[] = [];
        if (!submodel) {
            return items;
        }

        return semanticId === CARBON_FOOTPRINT_0_9
            ? this.createCarbonFootprints_0_9(submodel, currentLang)
            : this.createCarbonFootprints_1_0(submodel, currentLang);
    });

    /** The current active carbon footprint item. */
    public readonly carbonFootprint = computed(() => {
        return this.carbonFootprintItems()[this.index() - 1];
    });

    /** The semantic identifier of the submodel. */
    public readonly semanticId = computed(() => {
        const submodel = this.submodel();
        if (!submodel) {
            return undefined;
        }

        return getSemanticId(submodel);
    });

    public readonly index = signal(1);

    public readonly count = computed(() => this.carbonFootprintItems().length);

    private totalPcfCO2eq_0_9(env: aas.Environment, submodel: aas.Submodel, currentLang: string): string {
        if (!submodel.submodelElements) {
            return '-';
        }

        let total = 0.0;
        let unit: string | undefined;
        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && sme.value && getSemanticId(sme) === CarbonFootprint_0_9_Id) {
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

        return `${total.toLocaleString(currentLang)} ${unit}`;
    }

    private totalPcfCO2eq_1_0(env: aas.Environment, submodel: aas.Submodel, currentLang: string): string {
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

        return `${total.toLocaleString(currentLang)} ${unit}`;
    }

    private createCarbonFootprints_0_9(submodel: aas.Submodel, currentLang: string): DataSheetData[] {
        const dataSheets: DataSheetData[] = [];
        if (!submodel.submodelElements) {
            return dataSheets;
        }

        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme) && sme.value && getSemanticId(sme) === CarbonFootprint_0_9_Id) {
                dataSheets.push(this.createCarbonFootprint_0_9(submodel, sme, currentLang));
            }
        }

        return dataSheets;
    }

    private createCarbonFootprints_1_0(submodel: aas.Submodel, currentLang: string): DataSheetData[] {
        const dataSheets: DataSheetData[] = [];
        const productCarbonFootprints = getReferable(submodel, 'ProductCarbonFootprints');
        if (!isSubmodelElementList(productCarbonFootprints) || !productCarbonFootprints.value) {
            return dataSheets;
        }

        for (const productCarbonFootprint of productCarbonFootprints.value) {
            if (isSubmodelElementCollection(productCarbonFootprint) && productCarbonFootprint.value) {
                dataSheets.push(this.createCarbonFootprint_1_0(submodel, productCarbonFootprint, currentLang));
            }
        }

        return dataSheets;
    }

    private createCarbonFootprint_1_0(
        submodel: aas.Submodel,
        productCarbonFootprint: aas.SubmodelElementCollection,
        currentLang: string,
    ): DataSheetData {
        return createDataSheet(untracked(this.document)!, submodel, productCarbonFootprint, currentLang, {
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

    private createCarbonFootprint_0_9(
        submodel: aas.Submodel,
        productCarbonFootprint: aas.SubmodelElementCollection,
        currentLang: string,
    ): DataSheetData {
        return createDataSheet(untracked(this.document)!, submodel, productCarbonFootprint, currentLang, {
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
