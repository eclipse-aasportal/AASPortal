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
    getChildren,
    getReferable,
    getSemanticId,
    getUnit,
    isFile,
    isSubmodelElementCollection,
    parseNumber,
} from 'aas-core';

import { CarbonFootprint_0_9, CarbonFootprint_1_0 } from '../views';
import { createDataSheetItem, getDisplayName, getUrl } from '../../utilities';
import { DataSheetData, DataSheetItem, DataSheetItemPath } from '../../types';
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
        const items: DataSheetData[] = [];
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

    private createCarbonFootprint(smc: aas.SubmodelElementCollection): DataSheetData {
        const env = this.document()!.content!;
        const currentLang = this.currentLang();
        const carbonFootprint: DataSheetData = {
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
                    idShortPath: 'GoodsHandoverAddress',
                    format: '{Street} {HouseNumber}, {Country}-{ZipCode} {CityTown}',
                },
            ]),
        };

        return carbonFootprint;
    }

    private createDataSheet(
        sm: aas.SubmodelElement | aas.Submodel,
        env: aas.Environment,
        options?: DataSheetItemPath[],
    ): DataSheetItem[] {
        const items: DataSheetItem[] = [];
        if (options) {
            for (const option of options) {
                let item: DataSheetItem | undefined;
                if (typeof option === 'string') {
                    item = this.createItem(getReferable(sm, option), env);
                } else {
                    item = this.createItem(getReferable(sm, option.idShortPath), env, option.format);
                }

                if (item) {
                    items.push(item);
                }
            }
        } else {
            for (const referable of getChildren(sm)) {
                const item = this.createItem(referable, env);
                if (item) {
                    items.push(item);
                }
            }
        }

        return items;
    }

    private createItem(
        referable: aas.Referable | undefined,
        env: aas.Environment | undefined,
        format?: string,
    ): DataSheetItem | undefined {
        if (!referable) {
            return undefined;
        }

        const lang = untracked(this.currentLang);
        if (isFile(referable)) {
            return createDataSheetItem(referable, env, lang, {
                getUrl: (element: aas.Referable) => {
                    const document = this.document()!;
                    const submodel = this.submodel()!;
                    if (isFile(element)) {
                        return getUrl(document, submodel, element);
                    }

                    return undefined;
                },
            });
        }

        return createDataSheetItem(referable, env, lang, { format });
    }
}
