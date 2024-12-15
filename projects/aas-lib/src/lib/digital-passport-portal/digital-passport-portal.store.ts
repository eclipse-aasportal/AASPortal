/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, getChildren, getLocaleValue, isFile, isMultiLanguageProperty, isProperty } from 'aas-core';

type ViewData = {
    document: AASDocument;
    nameplate: aas.Submodel;
    carbonFootprint: aas.Submodel;
    handoverDocumentation: aas.Submodel;
};

@Injectable({ providedIn: 'root' })
export class DigitalProductPassportStore {
    public constructor(private readonly translate: TranslateService) {}

    public readonly viewData$ = signal<ViewData | undefined>(undefined);

    public readonly thumbnail$ = signal('');

    public getNameplateString(idShortPath: string[]): string {
        const submodel = this.viewData$()?.nameplate;
        if (submodel === undefined || submodel.submodelElements === undefined || idShortPath.length === 0) {
            return '';
        }

        const referable = this.getReferable(submodel, idShortPath);
        if (isProperty(referable)) {
            return referable.value || '';
        }

        if (isMultiLanguageProperty(referable)) {
            return getLocaleValue(referable.value, this.translate.currentLang) || '';
        }

        throw new Error(`Invalid path ${idShortPath.join('.')}.`);
    }

    public getNameplateFile(idShortPath: string[]): aas.File | undefined {
        const submodel = this.viewData$()?.nameplate;
        if (submodel === undefined || submodel.submodelElements === undefined || idShortPath.length === 0) {
            return undefined;
        }
        const referable = this.getReferable(submodel, idShortPath);
        if (isFile(referable)) {
            return referable;
        }

        return undefined;
    }

    private getReferable(submodel: aas.Submodel, idShortPath: string[]): aas.Referable | undefined {
        let referable: aas.Referable | undefined = submodel;
        for (const idShort of idShortPath) {
            const children = getChildren(referable);
            referable = children.find(child => child.idShort === idShort);
            if (referable === undefined) {
                return undefined;
            }
        }

        return referable;
    }
}
