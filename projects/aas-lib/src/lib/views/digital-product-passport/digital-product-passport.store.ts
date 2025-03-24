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

export type CarbonFootprintItem = {
    value: number;
    Name: string;
    PCFCO2eq: string;
    PCFLifeCyclePhase: [string, string][];
    PCFCalculationMethod: string;
    PCFGoodsAddressHandover: string;
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

const emptyCarbonFootprintItem: CarbonFootprintItem = {
    value: 0,
    Name: '-',
    PCFCO2eq: '-',
    PCFLifeCyclePhase: [],
    PCFCalculationMethod: '-',
    PCFGoodsAddressHandover: '-',
};

const PCFLifeCyclePhaseIds: [string, string][] = [
    ['0173-1#07-ABU208#001', '1'],
    ['0173-1#07-ABU209#001', '2'],
    ['0173-1#07-ABU210#001', '3'],
    ['0173-1#07-ABU211#001', '4'],
    ['0173-1#07-ABU212#001', '5'],
    ['0173-1#07-ABV498#001', '6'],
    ['0173-1#07-ABV497#001', '7'],
    ['0173-1#07-ABV499#001', '8'],
    ['0173-1#07-ABV500#001', '9'],
    ['0173-1#07-ABV501#001', '10'],
    ['0173-1#07-ABV502#001', '11'],
    ['0173-1#07-ABU213#001', '12'],
    ['0173-1#07-ABV503#001', '13'],
    ['0173-1#07-ABV504#001', '14'],
    ['0173-1#07-ABU214#001', '15'],
    ['0173-1#07-ABZ789#001', '16'],
];

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

        const firstName = this.getPropertyValue(nameplate, 'ContactInformation.FirstName');
        const nameOfContact = this.getPropertyValue(nameplate, 'ContactInformation.NameOfContact');
        const nationalCode = this.getPropertyValue(nameplate, 'ContactInformation.NationalCode');
        const zipCode = this.getPropertyValue(nameplate, 'ContactInformation.Zipcode');
        const cityTown = this.getPropertyValue(nameplate, 'ContactInformation.CityTown');
        return {
            ManufacturerProductFamily: this.getPropertyValue(nameplate, 'ManufacturerProductFamily'),
            ManufacturerProductDesignation: this.getPropertyValue(nameplate, 'ManufacturerProductDesignation'),
            OrderCodeOfManufacturer: this.getPropertyValue(nameplate, 'OrderCodeOfManufacturer'),
            SerialNumber: this.getPropertyValue(nameplate, 'SerialNumber'),
            DateOfManufacture: this.getPropertyValue(nameplate, 'DateOfManufacture'),
            ManufacturerName: this.getPropertyValue(nameplate, 'ManufacturerName'),
            NameOfContact: `${firstName} ${nameOfContact}`,
            Language: this.getPropertyValue(nameplate, 'ContactInformation.Language'),
            TelephoneNumber: this.getPropertyValue(nameplate, 'ContactInformation.Phone.TelephoneNumber'),
            EmailAddress: this.getPropertyValue(nameplate, 'ContactInformation.Email.EmailAddress'),
            Company: this.getPropertyValue(nameplate, 'ContactInformation.Company'),
            CityTown: `${nationalCode}-${zipCode} ${cityTown}`,
            Street: this.getPropertyValue(nameplate, 'ContactInformation.Street'),
            StateCounty: this.getPropertyValue(nameplate, 'ContactInformation.StateCounty'),
            TimeZone: this.getPropertyValue(nameplate, 'ContactInformation.TimeZone'),
        };
    });

    public readonly carbonFootprintItems = computed(() => {
        const items: CarbonFootprintItem[] = [];
        const carbonFootprint = this.viewData$()?.carbonFootprint;
        if (carbonFootprint !== undefined && carbonFootprint.submodelElements) {
            for (const sme of carbonFootprint.submodelElements) {
                if (isSubmodelElementCollection(sme)) {
                    items.push(this.createCarbonFootprintItem(carbonFootprint, sme));
                }
            }
        }

        if (items.length === 0) {
            items.push(emptyCarbonFootprintItem);
        }

        return items;
    });

    public readonly totalPCFCO2eq = computed(() => {
        return convertToString(
            this.carbonFootprintItems()
                .map(item => item.value)
                .reduce((accumulator, value) => {
                    return (accumulator += value);
                }, 0),
            this.translate.currentLang,
        );
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

    private getPropertyValueAsNumber(submodel: aas.Submodel, idShortPath: string): number {
        const referable = getReferable(submodel, idShortPath);
        if (isProperty(referable)) {
            if (referable.valueType === 'xs:double') {
                return Number(referable.value);
            }
        }

        return NaN;
    }

    private getPropertyValueId(submodel: aas.Submodel, idShortPath: string): string {
        const referable = getReferable(submodel, idShortPath);
        if (isProperty(referable)) {
            if (referable.valueId) {
                return referable.valueId.keys.at(0)?.value ?? '-';
            }
        }

        return '-';
    }

    private createCarbonFootprintItem(
        carbonFootprint: aas.Submodel,
        smc: aas.SubmodelElementCollection,
    ): CarbonFootprintItem {
        const value = this.getPropertyValueAsNumber(carbonFootprint, `${smc.idShort}.PCFCO2eq`);
        const valueId = this.getPropertyValueId(carbonFootprint, `${smc.idShort}.PCFCO2eq`);
        const calculationMethod = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PCFCalculationMethod`);
        const publicationDate = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PublicationDate`);
        const street = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PCFGoodsAddressHandover.Street`);
        const houseNumber = this.getPropertyValue(
            carbonFootprint,
            `${smc.idShort}.PCFGoodsAddressHandover.HouseNumber`,
        );

        const zipCode = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PCFGoodsAddressHandover.ZipCode`);
        const cityTown = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PCFGoodsAddressHandover.CityTown`);
        const country = this.getPropertyValue(carbonFootprint, `${smc.idShort}.PCFGoodsAddressHandover.Country`);
        const item: CarbonFootprintItem = {
            value,
            Name: this.getDisplayName(smc),
            PCFCO2eq: `${convertToString(value, this.translate.currentLang)} kg, ${valueId}`,
            PCFLifeCyclePhase: this.getArray(smc, PCFLifeCyclePhaseIds),
            PCFCalculationMethod: `${calculationMethod}, ${publicationDate}`,
            PCFGoodsAddressHandover: `${street} ${houseNumber}, ${country}-${zipCode} ${cityTown}`,
        };

        return item;
    }

    private getArray(smc: aas.SubmodelElementCollection, valueIds: [string, string][]): [string, string][] {
        const values: [string, string][] = [];
        if (!smc.value) {
            return values;
        }

        const map = new Map(valueIds);
        for (const sme of smc.value) {
            if (isProperty(sme) && sme.value) {
                const valueId = sme.valueId?.keys.at(0)?.value;
                if (valueId) {
                    const index = map.get(valueId);
                    if (index) {
                        values.push([index, sme.value]);
                    }
                }
            }
        }

        return values;
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

    private getDisplayName(element: aas.SubmodelElement): string {
        return getLocaleValue(element.displayName, this.translate.currentLang) ?? element.idShort;
    }
}
