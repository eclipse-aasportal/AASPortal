/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    getReferable,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
} from 'aas-core';

import { basename } from '../../utilities';

type ViewData = {
    document: AASDocument;
    nameplate: aas.Submodel;
    carbonFootprint: aas.Submodel;
    handoverDocumentation: aas.Submodel;
};

export type NameValue = { name: string; value: string };

export type MainData = {
    uriOfTheProduct: string;
    productType: string;
    serialNumber: string;
};

export type NameplateItem = {
    ManufacturerProductDesignation: string;
    ManufacturerProductFamily: string;
    OrderCodeOfManufacturer: string;
    SerialNumber: string;
    DateOfManufacture: string;
    ManufacturerName: string;
    NameOfContact: string;
    Language: string;
    TelephoneNumber: string;
    EmailAddress: string;
    Company: string;
    Street: string;
    CityTown: string;
    StateCounty: string;
    TimeZone: string;
};

export type DocumentationItem = {
    title: string;
    version: string;
    filename: string;
    file: aas.File;
};

export type DocumentationData = {
    items: DocumentationItem[];
};

const emptyMainData: MainData = {
    uriOfTheProduct: '-',
    productType: '-',
    serialNumber: '-',
};

const emptyNameplate: NameplateItem = {
    ManufacturerProductDesignation: '-',
    ManufacturerProductFamily: '-',
    OrderCodeOfManufacturer: '-',
    SerialNumber: '-',
    DateOfManufacture: '-',
    ManufacturerName: '-',
    NameOfContact: '-',
    Language: '-',
    TelephoneNumber: '-',
    EmailAddress: '-',
    Company: '-',
    Street: '-',
    CityTown: '-',
    StateCounty: '-',
    TimeZone: '-',
};

@Injectable({ providedIn: 'root' })
export class DigitalProductPassportStore {
    public constructor(private readonly translate: TranslateService) {}

    public readonly viewData$ = signal<ViewData | undefined>(undefined);

    public readonly thumbnail$ = signal('');

    public readonly mainData = computed<MainData>(() => {
        const nameplate = this.viewData$()?.nameplate;
        if (nameplate === undefined) {
            return emptyMainData;
        }

        return {
            uriOfTheProduct: this.getPropertyValue(nameplate, 'URIOfTheProduct'),
            productType: this.getPropertyValue(nameplate, 'ManufacturerProductType'),
            serialNumber: this.getPropertyValue(nameplate, 'SerialNumber'),
        };
    });

    public readonly nameplateItems = computed<NameplateItem>(() => {
        const nameplate = this.viewData$()?.nameplate;
        if (nameplate === undefined) {
            return emptyNameplate;
        }

        const firstName = this.getPropertyValue(nameplate, 'AddressInformation.FirstName');
        const nameOfContact = this.getPropertyValue(nameplate, 'AddressInformation.NameOfContact');
        const nationalCode = this.getPropertyValue(nameplate, 'AddressInformation.NationalCode');
        const zipCode = this.getPropertyValue(nameplate, 'AddressInformation.Zipcode');
        const cityTown = this.getPropertyValue(nameplate, 'AddressInformation.CityTown');
        return {
            ManufacturerProductFamily: this.getPropertyValue(nameplate, 'ManufacturerProductFamily'),
            ManufacturerProductDesignation: this.getPropertyValue(nameplate, 'ManufacturerProductDesignation'),
            OrderCodeOfManufacturer: this.getPropertyValue(nameplate, 'OrderCodeOfManufacturer'),
            SerialNumber: this.getPropertyValue(nameplate, 'SerialNumber'),
            DateOfManufacture: this.getPropertyValue(nameplate, 'DateOfManufacture'),
            ManufacturerName: this.getPropertyValue(nameplate, 'ManufacturerName'),
            NameOfContact: `${firstName} ${nameOfContact}`,
            Language: this.getPropertyValue(nameplate, 'AddressInformation.Language'),
            TelephoneNumber: this.getPropertyValue(nameplate, 'AddressInformation.Phone.TelephoneNumber'),
            EmailAddress: this.getPropertyValue(nameplate, 'AddressInformation.Email.EmailAddress'),
            Company: this.getPropertyValue(nameplate, 'AddressInformation.Company'),
            CityTown: `${nationalCode}-${zipCode} ${cityTown}`,
            Street: this.getPropertyValue(nameplate, 'AddressInformation.Street'),
            StateCounty: this.getPropertyValue(nameplate, 'AddressInformation.StateCounty'),
            TimeZone: this.getPropertyValue(nameplate, 'AddressInformation.TimeZone'),
        };
    });

    public readonly documentationData = computed(() => {
        const data: DocumentationData = { items: [] };
        const handoverDocumentation = this.viewData$()?.handoverDocumentation;
        if (handoverDocumentation === undefined || !handoverDocumentation.submodelElements) {
            return data;
        }

        for (const sme of handoverDocumentation.submodelElements) {
            if (isSubmodelElementCollection(sme)) {
                if (sme.value === undefined) {
                    continue;
                }

                this.browseForDocumentation(sme.value, data.items, handoverDocumentation, sme.idShort);
            }
        }

        return data;
    });

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

    public getNameplateFile(idShortPath: string): aas.File | undefined {
        const submodel = this.viewData$()?.nameplate;
        if (submodel === undefined || submodel.submodelElements === undefined || idShortPath.length === 0) {
            return undefined;
        }

        const referable = getReferable(submodel, idShortPath);
        if (isFile(referable)) {
            return referable;
        }

        return undefined;
    }

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
                });
            }
        }
    }
}
