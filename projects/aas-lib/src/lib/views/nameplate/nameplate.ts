/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { toSignal } from '@angular/core/rxjs-interop';

import { AASDocument, getReferable, getSemanticId, isSubmodelElementCollection, isSubmodelElementList } from 'aas-core';

import { DataSheetData } from '../../types';
import { NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0, NAMEPLATE_2_0 } from '../views-constants';
import { createDataSheet, getDisplayName } from '../../utilities';
import { DataSheet } from '../../components/data-sheet/data-sheet';

@Component({
    selector: 'fhg-nameplate',
    imports: [TranslateModule, NgbAccordionModule, DataSheet],
    templateUrl: './nameplate.html',
    styleUrl: './nameplate.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nameplate {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;
    private readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => {
            const semanticId = getSemanticId(submodel);
            if (!semanticId) {
                return false;
            }

            return [NAMEPLATE_2_0, NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0].indexOf(semanticId) >= 0;
        });
    });

    public constructor(private readonly translate: TranslateService) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

    /** The active AAS document. */
    public readonly document = input<AASDocument>();

    public readonly dataSheets = computed(() => {
        const dataSheets: DataSheetData[] = [];
        const currentLang = this.currentLang();
        const submodel = this.submodel();
        const document = this.document();
        const env = document?.content;
        if (!submodel?.submodelElements || !env) {
            return dataSheets;
        }

        let dataSheet = createDataSheet(document, submodel, submodel, currentLang, {
            type: 'B',
            name: this.translate.instant('Nameplate.GENERAL'),
            exclude: ['Markings', 'AssetSpecificProperties'],
            items: [
                {
                    type: 'format',
                    idShortPath: 'AddressInformation',
                    format: '{Street}, {NationalCode}-{ZipCode} {CityTown}',
                },
            ],
        });

        if (dataSheet.items.length > 0) {
            dataSheets.push(dataSheet);
        }

        const markings = getReferable(submodel, 'Markings');
        if (isSubmodelElementList(markings) && markings.value) {
            let index = 1;
            for (const marking of markings.value) {
                dataSheet = createDataSheet(document, submodel, marking, currentLang, {
                    name: `${getDisplayName(marking, env)} [${index}]`,
                    type: 'B',
                });

                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                    ++index;
                }
            }
        }

        const assetProperties = getReferable(submodel, 'AssetSpecificProperties');
        if (isSubmodelElementCollection(assetProperties) && assetProperties.value) {
            dataSheet = createDataSheet(document, submodel, assetProperties, currentLang);
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        return dataSheets;
    });
}
