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
    getSemanticId,
    isFile,
    isSubmodelElementCollection,
    isSubmodelElementList,
} from 'aas-core';

import { DataSheetData } from '../../types';
import { FHGNameplate, HSUNameplate, Nameplate_3_0, ZVEINameplate } from '../views';
import { createDataSheetItem, getDisplayName, getUrl } from '../../utilities';
import { DataSheet } from '../../components/data-sheet/data-sheet';
import { DataSheetItem } from 'projects/aas-lib/dist';

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

            return [ZVEINameplate, FHGNameplate, HSUNameplate, Nameplate_3_0].indexOf(semanticId) >= 0;
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
        const env = this.document()?.content;
        if (!submodel?.submodelElements || !env) {
            return dataSheets;
        }

        const queue: [number, aas.Referable][] = [[0, submodel]];
        while (queue.length > 0) {
            const [level, parent] = queue.shift()!;
            const dataSheet: DataSheetData = {
                name:
                    level === 0
                        ? this.translate.instant('Nameplate.GENERAL')
                        : getDisplayName(parent, env, currentLang),
                level,
                items: [],
            };

            for (const child of getChildren(parent)) {
                let item: DataSheetItem | undefined;
                if (isSubmodelElementCollection(child) || isSubmodelElementList(child)) {
                    if (child.idShort === 'AddressInformation') {
                        item = createDataSheetItem(child, env, currentLang, {
                            type: 'format',
                            format: '{Street}, {NationalCode}-{ZipCode} {CityTown}',
                        });
                    } else {
                        queue.unshift([level + 1, child]);
                    }
                } else {
                    item = createDataSheetItem(child, env, currentLang, { type: 'url', getUrl: this.getUrl });
                }

                if (item) {
                    dataSheet.items.push(item);
                }
            }

            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
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
