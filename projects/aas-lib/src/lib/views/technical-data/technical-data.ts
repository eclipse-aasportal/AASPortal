/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal, untracked } from '@angular/core';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { toSignal } from '@angular/core/rxjs-interop';

import { aas, AASDocument, getChildren, getReferable, getSemanticId, isFile } from 'aas-core';

import { DataSheetData, DataSheetFormat, DataSheetItem, DataSheetItemPath } from '../../types';
import { Nameplate_3_0 } from '../views';
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

        return env.submodels.find(submodel => getSemanticId(submodel) === Nameplate_3_0);
    });

    public readonly groups = computed(() => {
        const groups: DataSheetData[] = [];
        this.currentLang();
        const submodel = this.submodel();
        if (!submodel?.submodelElements) {
            return groups;
        }

        groups.push(this.createGroup(submodel));

        return groups;
    });

    private createGroup(sm: aas.Referable): DataSheetData {
        const env = this.document()!.content!;
        const group: DataSheetData = {
            name: getDisplayName(sm, env, this.translate.currentLang),
            items: this.createDataSheet(sm, env),
        };

        return group;
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
                    item = this.createItem(getReferable(sm, option.idShort), env, option.format);
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
        format?: DataSheetFormat,
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
