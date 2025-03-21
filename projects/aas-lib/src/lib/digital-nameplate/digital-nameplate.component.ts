/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    getSemanticId,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
} from 'aas-core';

import { Location } from '@angular/common';

export type DigitalNameplate = {
    id: string;
    serialNumber: string;
    productCountryOfOrigin: string;
    yearOfConstruction: string;
    countryCode: string;
    zip: string;
    manufacturerName: string;
    cityTown: string;
    street: string;
};

const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
const HSUNameplate = 'https://www.hsu-hh.de/aut/aas/nameplate';

@Component({
    selector: 'fhg-digital-nameplate',
    templateUrl: './digital-nameplate.component.html',
    styleUrls: ['./digital-nameplate.component.scss'],
    imports: [TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalNameplateComponent implements OnInit {
    public constructor(
        private readonly location: Location,
        private readonly translate: TranslateService,
    ) {}

    public readonly nameplates = signal<DigitalNameplate[]>([]);

    public ngOnInit(): void {
        const state = this.location.getState() as Record<string, string>;
        if (state.data) {
            this.init(JSON.parse(state.data));
        }
    }

    private init(documents: AASDocument[]) {
        const submodels = [...this.filterSubmodels(documents)];
        this.nameplates.set(
            submodels.map(submodel => ({
                id: submodel.id,
                serialNumber: this.getPropertyValue(submodel, ['SerialNumber']),
                productCountryOfOrigin: this.getPropertyValue(submodel, ['ProductCountryOfOrigin']),
                yearOfConstruction: this.getPropertyValue(submodel, ['YearOfConstruction']),
                manufacturerName: this.getPropertyValue(submodel, ['ManufacturerName']),
                countryCode: this.getPropertyValue(submodel, ['PhysicalAddress', 'CountryCode']),
                zip: this.getPropertyValue(submodel, ['PhysicalAddress', 'Zip']),
                cityTown: this.getPropertyValue(submodel, ['PhysicalAddress', 'CityTown']),
                street: this.getPropertyValue(submodel, ['PhysicalAddress', 'Street']),
            })),
        );
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

    private *filterSubmodels(documents: AASDocument[]): Generator<aas.Submodel> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId === ZVEINameplate || semanticId === FHGNameplate || semanticId === HSUNameplate) {
                    yield submodel;
                }
            }
        }
    }
}
