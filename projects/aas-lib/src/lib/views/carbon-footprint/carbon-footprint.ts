/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    Inject,
    input,
    Signal,
    signal,
    untracked,
} from '@angular/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { toSignal } from '@angular/core/rxjs-interop';
import {
    aas,
    AASDocument,
    convertToString,
    getChildren,
    getLocaleValue,
    getReferable,
    getSemanticId,
    getUnit,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
    parseDate,
    parseNumber,
} from 'aas-core';

import { CarbonFootprint_1_0 } from '../views';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { createDataSheetItem, getDisplayName, getUrl } from '../../utilities';
import { DataSheetItem } from '../../types';
import { WINDOW, WindowService } from '../../services/window.service';

export type CarbonFootprintItem = {
    name: string;
    items: DataSheetItem[];
};

@Component({
    selector: 'fhg-carbon-footprint',
    imports: [TranslateModule, NgbAccordionModule, NgbPaginationModule],
    templateUrl: './carbon-footprint.html',
    styleUrl: './carbon-footprint.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprint {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(
        translate: TranslateService,
        @Inject(WINDOW) private readonly window: WindowService,
    ) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

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
                        unit = getUnit(this.document()!.content!, pcfCO2eq);
                    }
                }
            }
        }

        return `${total.toLocaleString(currentLang)} ${unit ?? 'kg'}`;
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
        this.window.open(url);
        $event.stopPropagation();
    }

    public isArray(value: unknown): boolean {
        return Array.isArray(value);
    }

    private createCarbonFootprint(smc: aas.SubmodelElementCollection): CarbonFootprintItem {
        const env = this.document()!.content!;
        const currentLang = this.currentLang();
        const carbonFootprint: CarbonFootprintItem = {
            name: getDisplayName(smc, env, currentLang),
            items: this.createDataSheet(smc, env, [
                'PcfCO2eq',
                'ReferenceImpactUnitForCalculation',
                'QuantityOfMeasureForCalculation',
                'LifeCyclePhases',
                'PcfCalculationMethods',
                'PublicationDate',
                'ExpirationDate',
                'ExplanatoryStatement',
                {
                    idShort: 'GoodsHandoverAddress',
                    format: '{0} {1}, {2}-{3} {4}',
                    items: ['Street', 'HouseNumber', 'Country', 'ZipCode', 'CityTown'],
                },
            ]),
        };

        // const goodsHandoverAddress = getReferable<aas.SubmodelElementCollection>(smc, 'GoodsHandoverAddress');
        // if (goodsHandoverAddress) {
        //     const street = getLocaleValue(
        //         getReferable<aas.MultiLanguageProperty>(goodsHandoverAddress, 'Street')?.value,
        //         currentLang,
        //     );

        //     const houseNumber = getLocaleValue(
        //         getReferable<aas.MultiLanguageProperty>(goodsHandoverAddress, 'HouseNumber')?.value,
        //         currentLang,
        //     );

        //     const zipCode = getLocaleValue(
        //         getReferable<aas.MultiLanguageProperty>(goodsHandoverAddress, 'ZipCode')?.value,
        //         currentLang,
        //     );

        //     const cityTown = getLocaleValue(
        //         getReferable<aas.MultiLanguageProperty>(goodsHandoverAddress, 'CityTown')?.value,
        //         currentLang,
        //     );

        //     const country = getLocaleValue(
        //         getReferable<aas.MultiLanguageProperty>(goodsHandoverAddress, 'Country')?.value,
        //         currentLang,
        //     );

        //     carbonFootprint.items.push({
        //         idShort: goodsHandoverAddress.idShort,
        //         displayName: getDisplayName(goodsHandoverAddress, env, currentLang),
        //         value: `${street} ${houseNumber}, ${country}-${zipCode} ${cityTown}`,
        //     });
        // }

        return carbonFootprint;
    }

    private createDataSheet(
        sm: aas.SubmodelElement | aas.Submodel,
        env: aas.Environment,
        options?: (string | { idShort: string; format: string; items: string[] })[],
    ): DataSheetItem[] {
        const lang = untracked(this.currentLang);
        const items: DataSheetItem[] = [];
        const document = this.document()!;
        const submodel = this.submodel()!;
        if (options) {
            for (const item of options) {
                let referable: aas.Referable | undefined;
                if (typeof item === 'string') {
                    referable = getReferable(sm, item);
                } else {
                    referable = getReferable(sm, item.idShort);
                }

                if (referable) {
                    a(referable);
                }
            }
        } else {
            for (const referable of getChildren(sm)) {
                a(referable);
            }
        }

        return items;

        function a(referable: aas.Referable): void {
            let item: DataSheetItem | undefined;
            if (isFile(referable)) {
                item = createDataSheetItem(referable, env, lang, getUrl(document, submodel, referable));
            } else {
                item = createDataSheetItem(referable, env, lang);
            }

            if (item) {
                items.push(item);
            }
        }
    }
}
