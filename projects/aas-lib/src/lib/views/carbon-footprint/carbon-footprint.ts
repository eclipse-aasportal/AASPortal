/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, Inject, input, signal } from '@angular/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import {
    aas,
    AASDocument,
    convertToString,
    getReferable,
    getSemanticId,
    getUnit,
    isProperty,
    isSubmodelElementCollection,
    parseDate,
    parseNumber,
} from 'aas-core';
import { CarbonFootprint_1_0 } from '../views';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getDisplayName, getUrl } from '../../utilities';
import { NameValue } from '../../types';
import { WINDOW, WindowService } from '../../services/window.service';

export type CarbonFootprintItem = {
    name: string;
    items: NameValue[];
};

@Component({
    selector: 'fhg-carbon-footprint',
    imports: [TranslateModule, NgbAccordionModule, NgbPaginationModule],
    templateUrl: './carbon-footprint.html',
    styleUrl: './carbon-footprint.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprint {
    public constructor(
        private readonly translate: TranslateService,
        @Inject(WINDOW) private readonly window: WindowService,
    ) {}

    public readonly document = input<AASDocument>();

    public readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => getSemanticId(submodel) === CarbonFootprint_1_0);
    });

    public readonly totalPcfCO2eq = computed(() => {
        const submodel = this.submodel();
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
                        unit = getUnit(this.document()!.content!, pcfCO2eq);
                    }
                }
            }
        }

        return `${total.toLocaleString(this.translate.currentLang)} ${unit ?? 'kg'}`;
    });

    public readonly carbonFootprintItems = computed(() => {
        const submodel = this.submodel();
        const items: CarbonFootprintItem[] = [];
        if (!submodel) {
            return items;
        }

        const sml = getReferable<aas.SubmodelElementList>(submodel, 'ProductCarbonFootprints');
        if (!sml || !sml.value) {
            return items;
        }

        for (const item of sml.value) {
            if (isSubmodelElementCollection(item)) {
                items.push(this.createCarbonFootprint(item));
            }
        }

        return items;
    });

    public readonly carbonFootprint = computed(() => {
        return this.carbonFootprintItems()[this.carbonFootprintIndex() - 1];
    });

    public readonly carbonFootprintIndex = signal(1);

    public readonly carbonFootprintSize = computed(() => this.carbonFootprintItems().length);

    public open($event: MouseEvent, url: string) {
        this.window.open(url)
        $event.stopPropagation();
    }

    private createCarbonFootprint(smc: aas.SubmodelElementCollection): CarbonFootprintItem {
        const env = this.document()!.content!;
        const carbonFootprint: CarbonFootprintItem = {
            name: getDisplayName(smc, env, this.translate.currentLang),
            items: [],
        };

        const pcfCO2eq = getReferable<aas.Property>(smc, 'PcfCO2eq');
        if (pcfCO2eq) {
            carbonFootprint.items.push({
                name: getDisplayName(pcfCO2eq, env, this.translate.currentLang),
                value: `${convertToString(parseNumber(pcfCO2eq.value, this.translate.currentLang))} ${getUnit(env, pcfCO2eq) ?? 'kg'}`,
            });
        }

        const referenceImpactUnitForCalculation = getReferable<aas.Property>(smc, 'ReferenceImpactUnitForCalculation');
        if (referenceImpactUnitForCalculation?.value) {
            carbonFootprint.items.push({
                name: getDisplayName(referenceImpactUnitForCalculation, env, this.translate.currentLang),
                value: referenceImpactUnitForCalculation.value,
            });
        }

        const quantityOfMeasureForCalculation = getReferable<aas.Property>(smc, 'QuantityOfMeasureForCalculation');
        if (quantityOfMeasureForCalculation?.value) {
            carbonFootprint.items.push({
                name: getDisplayName(quantityOfMeasureForCalculation, env, this.translate.currentLang),
                value: convertToString(parseNumber(quantityOfMeasureForCalculation.value), this.translate.currentLang),
            });
        }

        const liveCyclePhases = getReferable<aas.SubmodelElementList>(smc, 'LiveCyclePhases');
        if (liveCyclePhases?.value) {
            for (const liveCyclePhase of liveCyclePhases.value) {
                if (isProperty(liveCyclePhase) && liveCyclePhase.value) {
                    carbonFootprint.items.push({
                        name: getDisplayName(liveCyclePhase, env, this.translate.currentLang),
                        value: liveCyclePhase.value,
                    });
                }
            }
        }

        const calculationMethods = getReferable<aas.SubmodelElementList>(smc, 'PcfCalculationMethods');
        if (calculationMethods?.value) {
            for (const calculationMethod of calculationMethods.value) {
                if (isProperty(calculationMethod) && calculationMethod.value) {
                    carbonFootprint.items.push({
                        name: getDisplayName(calculationMethod, env, this.translate.currentLang),
                        value: calculationMethod.value,
                    });
                }
            }
        }

        const publicationDate = getReferable<aas.Property>(smc, 'PublicationDate');
        if (publicationDate?.value) {
            carbonFootprint.items.push({
                name: getDisplayName(publicationDate, env, this.translate.currentLang),
                value: convertToString(parseDate(publicationDate.value, this.translate.currentLang)),
            });
        }

        const expirationDate = getReferable<aas.Property>(smc, 'ExpirationDate');
        if (expirationDate?.value) {
            carbonFootprint.items.push({
                name: getDisplayName(expirationDate, env, this.translate.currentLang),
                value: convertToString(parseDate(expirationDate.value, this.translate.currentLang)),
            });
        }

        const explanatoryStatement = getReferable<aas.File>(smc, 'ExplanatoryStatement');
        if (explanatoryStatement?.value) {
            carbonFootprint.items.push({
                name: getDisplayName(explanatoryStatement, env, this.translate.currentLang),
                value: explanatoryStatement.value,
                url: getUrl(this.document()!, this.submodel()!, explanatoryStatement),
            });
        }

        const goodsHandoverAddress = getReferable<aas.SubmodelElementCollection>(smc, 'GoodsHandoverAddress');
        if (goodsHandoverAddress) {
            const street = getReferable<aas.Property>(goodsHandoverAddress, 'Street');
            const houseNumber = getReferable<aas.Property>(goodsHandoverAddress, 'HouseNumber');
            const zipCode = getReferable<aas.Property>(goodsHandoverAddress, 'ZipCode');
            const cityTown = getReferable<aas.Property>(goodsHandoverAddress, 'CityTown');
            const country = getReferable<aas.Property>(goodsHandoverAddress, 'Country');
            carbonFootprint.items.push({
                name: getDisplayName(goodsHandoverAddress, env, this.translate.currentLang),
                value: `${street?.value} ${houseNumber?.value}, ${country?.value}-${zipCode?.value} ${cityTown?.value}`,
            });
        }

        return carbonFootprint;
    }
}
