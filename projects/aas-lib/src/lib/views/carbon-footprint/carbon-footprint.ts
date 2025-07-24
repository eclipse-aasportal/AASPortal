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
import { ChangeDetectionStrategy, Component, computed, input, Signal, signal } from '@angular/core';

import {
    aas,
    AASDocument,
    getReferable,
    getSemanticId,
    getUnit,
    isSubmodelElementCollection,
    parseNumber,
} from 'aas-core';

import { CarbonFootprint_0_9, CarbonFootprint_1_0 } from '../views';
import { createDataSheet } from '../../utilities';
import { DataSheetData } from '../../types';
import { DataSheet } from '../../components/data-sheet/data-sheet';

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
            return semanticId === CarbonFootprint_1_0 || semanticId === CarbonFootprint_0_9;
        });
    });

    public readonly version = computed(() => {
        const administration = this.submodel()?.administration;
        if (!administration) {
            return undefined;
        }

        return `${administration.version}.${administration.revision}`;
    });

    public readonly totalPcfCO2eq = computed(() => {
        const submodel = this.submodel();
        const env = this.document()?.content!;
        const currentLang = this.currentLang();
        if (!submodel) {
            return '-';
        }

        const list = getReferable<aas.SubmodelElementList>(submodel, 'ProductCarbonFootprints');
        if (!list || !list.value) {
            return '-';
        }

        let total = 0.0;
        let unit: string | undefined;
        for (const collection of list.value) {
            if (isSubmodelElementCollection(collection)) {
                const pcfCO2eq = getReferable<aas.Property>(collection, 'PcfCO2eq');
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

        return `${total.toLocaleString(currentLang)} ${unit ?? 'kg'}`;
    });

    public readonly carbonFootprintItems = computed(() => {
        const document = this.document();
        const submodel = this.submodel();
        const currentLang = this.currentLang();
        const items: DataSheetData[] = [];
        if (!document || !submodel) {
            return items;
        }

        const sml = getReferable<aas.SubmodelElementList>(submodel, 'ProductCarbonFootprints');
        if (!sml || !sml.value) {
            return items;
        }

        for (const item of sml.value) {
            if (isSubmodelElementCollection(item)) {
                items.push(this.createCarbonFootprint(document, submodel, item, currentLang));
            }
        }

        return items;
    });

    public readonly carbonFootprint = computed(() => {
        return this.carbonFootprintItems()[this.index() - 1];
    });

    public readonly index = signal(1);

    public readonly count = computed(() => this.carbonFootprintItems().length);

    private createCarbonFootprint(
        document: AASDocument,
        submodel: aas.Submodel,
        collection: aas.SubmodelElementCollection,
        currentLang: string,
    ): DataSheetData {
        return createDataSheet(document, submodel, collection, currentLang, {
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
}
