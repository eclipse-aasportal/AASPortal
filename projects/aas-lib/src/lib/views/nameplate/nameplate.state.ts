/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, getReferable, isSubmodelElementCollection, isSubmodelElementList } from 'aas-core';
import { createDataSheet, findSubmodel, getDisplayName } from '../../utilities';
import { ChildState } from '../../components/child-state';
import { NAMEPLATE_2_0, NAMEPLATE_3_0, NAMEPLATE_FHG, NAMEPLATE_HSU } from '../views-constants';
import { DataSheetData } from '../../types';

export type NameplateData = {
    document: AASDocument | null;
    submodel: aas.Submodel | null;
    dataSheets: DataSheetData[];
};

const initialState: NameplateData = {
    document: null,
    submodel: null,
    dataSheets: [],
};

/**
 * Manages the state of the Nameplate component.
 */
@Injectable()
export class NameplateState extends ChildState {
    private readonly document$ = signal(initialState.document);
    private readonly submodel$ = signal(initialState.submodel);
    private readonly dataSheets$ = signal(initialState.dataSheets);

    public constructor() {
        super(inject(TranslateService));

        effect(() => {
            const document = this.document$();
            if (!document) {
                return;
            }

            const submodel = findSubmodel(document, [NAMEPLATE_2_0, NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0]);
            if (!submodel) {
                return;
            }

            this.update({ submodel, dataSheets: this.createDataSheets(document, submodel) });
        });

        effect(() => {
            this.currentLang();
            const submodel = untracked(this.submodel$);
            const document = untracked(this.document$);
            if (!document || !submodel) {
                return;
            }

            this.update({ dataSheets: this.createDataSheets(document, submodel) });
        });
    }

    /** The current active AAS document. */
    public readonly document = this.document$.asReadonly();

    /** The presentation of the nameplate. */
    public readonly dataSheets = this.dataSheets$.asReadonly();

    /**
     * Updates the state.
     * @param newState The new state.
     */
    public update(newState: Partial<NameplateData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }

        if (newState.submodel !== undefined) {
            this.submodel$.set(newState.submodel);
        }

        if (newState.dataSheets !== undefined) {
            this.dataSheets$.set(newState.dataSheets);
        }
    }

    private createDataSheets(document: AASDocument, submodel: aas.Submodel): DataSheetData[] {
        const dataSheets: DataSheetData[] = [];
        const env = document?.content;
        if (!submodel?.submodelElements || !env) {
            return dataSheets;
        }

        let dataSheet = createDataSheet(document, submodel, this.currentLang(), {
            type: 'B',
            name: this.translate.instant('Nameplate.GENERAL'),
            exclude: ['Markings', 'AssetSpecificProperties'],
            items: [
                {
                    type: 'format',
                    idShortPath: 'AddressInformation',
                    format: '{Street} {NationalCode}-{Zipcode} {CityTown}',
                },
                {
                    type: 'format',
                    idShortPath: 'PhysicalAddress',
                    format: '{Street} {CountryCode}-{Zip} {CityTown}',
                },
            ],
        });

        if (dataSheet.items.length > 0) {
            dataSheets.push(dataSheet);
        }

        const markings = getReferable(submodel, 'Markings');
        if (isSubmodelElementList(markings) && markings.value) {
            let index = 1;
            for (const marking of markings.value) {
                dataSheet = createDataSheet(document, marking, this.currentLang(), {
                    name: `${getDisplayName(marking, env)} [${index}]`,
                    type: 'B',
                });

                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                    ++index;
                }
            }
        }

        const assetProperties = getReferable(submodel, 'AssetSpecificProperties');
        if (isSubmodelElementCollection(assetProperties) && assetProperties.value) {
            dataSheet = createDataSheet(document, assetProperties, this.currentLang());
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        return dataSheets;
    }
}
