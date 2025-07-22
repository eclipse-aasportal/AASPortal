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

import {
    aas,
    AASDocument,
    getChildren,
    getReferable,
    getSemanticId,
    isFile,
    isSubmodelElementCollection,
    isSubmodelElementList,
} from 'aas-core';

import { DataSheetData, DataSheetItem } from '../../types';
import { TechnicalData_1_2 } from '../views';
import { createDataSheetItem, getDisplayName, getUrl } from '../../utilities';
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

        return env.submodels.find(submodel => getSemanticId(submodel) === TechnicalData_1_2);
    });

    public readonly dataSheets = computed(() => {
        const dataSheets: DataSheetData[] = [];
        const currentLang = this.currentLang();
        const submodel = this.submodel();
        const env = this.document()?.content;
        if (!submodel?.submodelElements || !env) {
            return dataSheets;
        }

        const idShorts = ['GeneralInformation', 'ProductClassifications', 'TechnicalProperties', 'FurtherInformation'];
        for (const idShort of idShorts) {
            const smc = getReferable(submodel, idShort);
            if (!smc) {
                continue;
            }

            const queue: [number, aas.Referable][] = [[0, smc]];
            while (queue.length > 0) {
                const [level, parent] = queue.shift()!;
                const dataSheet: DataSheetData = {
                    name: getDisplayName(parent, env, currentLang),
                    level,
                    items: [],
                };

                for (const child of getChildren(parent)) {
                    let item: DataSheetItem | undefined;
                    if (isSubmodelElementCollection(child) || isSubmodelElementList(child)) {
                        queue.unshift([level + 1, child]);
                    } else {
                        item = createDataSheetItem(child, env, currentLang, { getUrl: this.getUrl });
                    }

                    if (item) {
                        dataSheet.items.push(item);
                    }
                }

                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                }
            }
        }

        return dataSheets;
    });

    private readonly getUrl = (element: aas.Referable) => {
        if (isFile(element)) {
            return getUrl(this.document()!, this.submodel()!, element);
        }

        return undefined;
    };
}
