/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';

import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    getReferable,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
} from 'aas-core';

import { HandoverDocumentation_001, HandoverDocumentation_003 } from '../views';
import { basename, getUrl } from '../../utilities';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

export type DocumentationItem = {
    title: string;
    version: string;
    filename: string;
    file: aas.File;
    url: string;
};

@Component({
    selector: 'fhg-handover-documentation',
    imports: [TranslateModule, NgbAccordionModule],
    templateUrl: './handover-documentation.html',
    styleUrl: './handover-documentation.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentation {
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

        return env.submodels.find(submodel => {
            const semanticId = getSemanticId(submodel);
            return semanticId === HandoverDocumentation_001 || HandoverDocumentation_003;
        });
    });

    public readonly items = computed(() => {
        this.currentLang();
        const items: DocumentationItem[] = [];
        const submodel = this.submodel();
        const document = this.document();
        if (!document || !submodel?.submodelElements) {
            return items;
        }

        for (const sme of submodel.submodelElements) {
            if (isSubmodelElementCollection(sme)) {
                if (sme.value === undefined) {
                    continue;
                }

                this.browseForDocumentation(sme.value, items, submodel, sme.idShort);
            }
        }

        return items;
    });

    private browseForDocumentation(
        elements: aas.SubmodelElement[],
        items: DocumentationItem[],
        sm: aas.Submodel,
        idShortPath: string,
    ) {
        for (const element of elements) {
            if (isSubmodelElementCollection(element)) {
                if (element.value) {
                    this.browseForDocumentation(element.value, items, sm, idShortPath + '.' + element.idShort);
                }
            } else if (isFile(element)) {
                items.push({
                    title: this.getPropertyValue(sm, idShortPath + '.Title'),
                    version: this.getPropertyValue(sm, idShortPath + '.Version'),
                    filename: element.value ? basename(element.value) : '-',
                    file: element,
                    url: getUrl(this.document()!, this.submodel()!, element),
                });
            }
        }
    }

    public getPropertyValue(submodel: aas.Submodel, idShortPath: string): string {
        const referable = getReferable(submodel, idShortPath);
        if (isProperty(referable)) {
            switch (referable.valueType) {
                case 'xs:double':
                case 'xs:integer':
                    return convertToString(referable.value, this.translate.currentLang);
                case 'xs:string':
                    return referable.value ?? '';
                default:
                    return referable.value ?? '-';
            }
        }

        if (isMultiLanguageProperty(referable)) {
            return getLocaleValue(referable.value, this.translate.currentLang) ?? '-';
        }

        return '-';
    }
}
