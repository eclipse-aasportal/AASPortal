/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import {
    aas,
    AASDocument,
    getChildren,
    getReferable,
    getSemanticId,
    isFile,
    isSubmodelElementCollection,
} from 'aas-core';
import { ContactInformations_1_0 } from '../views';
import { DataSheetData, DataSheetItem, DataSheetItemPath } from '../../types';
import { createDataSheetItem, getDisplayName, getUrl } from '../../utilities';
import { DataSheet } from '../../components/data-sheet/data-sheet';

@Component({
    selector: 'fhg-contact-informations',
    imports: [NgbAccordionModule, DataSheet],
    templateUrl: './contact-informations.html',
    styleUrl: './contact-informations.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformations {
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

        return env.submodels.find(submodel => getSemanticId(submodel) === ContactInformations_1_0);
    });

    public readonly contacts = computed(() => {
        const contact: DataSheetData[] = [];
        this.currentLang();
        const document = this.document();
        const submodel = this.submodel();
        if (!document || !submodel?.submodelElements) {
            return contact;
        }

        for (const element of submodel.submodelElements) {
            if (isSubmodelElementCollection(element)) {
                contact.push(this.createContact(element));
            }
        }

        return contact;
    });

    private createContact(collection: aas.SubmodelElementCollection): DataSheetData {
        const env = this.document()!.content!;
        const contact: DataSheetData = {
            name: getDisplayName(collection, env, this.translate.currentLang),
            items: this.createDataSheet(collection, env),
        };

        return contact;
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
