/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    aas,
    convertToString,
    getLocaleValue,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
} from 'common';
import { DocumentSubmodelPair, SubmodelTemplate } from '../submodel-template/submodel-template';

export interface DigitalNameplate {
    serialNumber: string;
    productCountryOfOrigin: string;
    yearOfConstruction: string;
    countryCode: string;
    zip: string;
    manufacturerName: string;
    cityTown: string;
    street: string;
}

@Component({
    selector: 'fhg-digital-nameplate',
    templateUrl: './digital-nameplate.component.html',
    styleUrls: ['./digital-nameplate.component.scss'],
    standalone: true,
    imports: [TranslateModule],
})
export class DigitalNameplateComponent implements SubmodelTemplate, OnChanges {
    public constructor(private readonly translate: TranslateService) {}

    @Input()
    public submodels: DocumentSubmodelPair[] | null = null;

    public nameplates: DigitalNameplate[] = [];

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['submodels']) {
            this.init();
        }
    }

    private init() {
        this.nameplates =
            this.submodels?.map(pair => {
                const submodel = pair.submodel;
                return {
                    serialNumber: this.getPropertyValue(submodel, ['SerialNumber']),
                    productCountryOfOrigin: this.getPropertyValue(submodel, ['ProductCountryOfOrigin']),
                    yearOfConstruction: this.getPropertyValue(submodel, ['YearOfConstruction']),
                    manufacturerName: this.getPropertyValue(submodel, ['ManufacturerName']),
                    countryCode: this.getPropertyValue(submodel, ['PhysicalAddress', 'CountryCode']),
                    zip: this.getPropertyValue(submodel, ['PhysicalAddress', 'Zip']),
                    cityTown: this.getPropertyValue(submodel, ['PhysicalAddress', 'CityTown']),
                    street: this.getPropertyValue(submodel, ['PhysicalAddress', 'Street']),
                };
            }) ?? [];
    }

    private getPropertyValue(submodel: aas.Submodel, path: string[]): string {
        let children = submodel.submodelElements;
        for (const idShort of path) {
            const child = children?.find(child => child.idShort === idShort);
            if (!child) {
                break;
            }

            if (isSubmodelElementCollection(child)) {
                children = child.value;
            } else if (isProperty(child)) {
                return convertToString(child.value, this.translate.currentLang);
            } else if (isMultiLanguageProperty(child)) {
                return getLocaleValue(child.value, this.translate.currentLang) ?? 'N/D';
            }
        }

        return '';
    }
}
