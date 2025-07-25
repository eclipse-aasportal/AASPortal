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

import { AASDocument, getReferable, getSemanticId, isSubmodelElementCollection } from 'aas-core';

import { DataSheetData } from '../../types';
import { TECHNICAL_DATA_1_2 } from '../views';
import { createDataSheet } from '../../utilities';
import { DataSheet } from '../../components/data-sheet/data-sheet';

@Component({
    selector: 'fhg-technical-data',
    imports: [TranslateModule, NgbAccordionModule, DataSheet],
    templateUrl: './technical-data.html',
    styleUrl: './technical-data.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalData {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(private readonly translate: TranslateService) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

    public readonly document = input<AASDocument>();

    public readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => getSemanticId(submodel) === TECHNICAL_DATA_1_2);
    });

    public readonly dataSheets = computed(() => {
        const dataSheets: DataSheetData[] = [];
        const currentLang = this.currentLang();
        const submodel = this.submodel();
        const document = this.document();
        const env = document?.content;
        if (!submodel?.submodelElements || !env) {
            return dataSheets;
        }

        const generalInfo = getReferable(submodel, 'GeneralInformation');
        if (generalInfo) {
            const dataSheet = createDataSheet(document, submodel, generalInfo, currentLang);
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        const productClassifications = getReferable(submodel, 'ProductClassifications');
        if (isSubmodelElementCollection(productClassifications) && productClassifications.value) {
            for (const item of productClassifications.value) {
                const dataSheet = createDataSheet(document, submodel, item, currentLang);
                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                }
            }
        }

        const technicalProperties = getReferable(submodel, 'TechnicalProperties');
        if (isSubmodelElementCollection(technicalProperties) && technicalProperties.value) {
            for (const item of technicalProperties.value) {
                const dataSheet = createDataSheet(document, submodel, item, currentLang);
                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                }
            }
        }

        const furtherInfo = getReferable(submodel, 'FurtherInformation');
        if (furtherInfo) {
            const dataSheet = createDataSheet(document, submodel, furtherInfo, currentLang);
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        return dataSheets;
    });
}
