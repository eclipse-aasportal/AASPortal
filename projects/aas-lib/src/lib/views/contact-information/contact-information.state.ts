/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AASDocument, getSemanticId } from 'aas-core';
import { DataSheetData } from '../../types';
import { createDataSheet, getDisplayName } from '../../utilities';
import { ChildState } from '../../components/child-state';
import { CONTACT_INFORMATION_1_0 } from '../views-constants';

export type ContactInformationData = {
    document: AASDocument | null;
};

const initialState: ContactInformationData = {
    document: null,
};

/**
 * Manages the state for the Contact Information component.
 */
@Injectable()
export class ContactInformationState extends ChildState {
    private readonly document$ = signal(initialState.document);

    public constructor() {
        super(inject(TranslateService));
    }

    private readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => getSemanticId(submodel) === CONTACT_INFORMATION_1_0);
    });

    /**
     * The current active AAS document.
     */
    public readonly document = this.document$.asReadonly();

    /**
     * The computed list of contact data sheets.
     */
    public readonly contacts = computed(() => {
        const contacts: DataSheetData[] = [];
        const document = this.document();
        const submodel = this.submodel();
        const env = document?.content;
        if (!env || !submodel?.submodelElements) {
            return contacts;
        }

        let index = 1;
        for (const element of submodel.submodelElements) {
            const dataSheet = createDataSheet(document, element, this.currentLang(), {
                name: `${getDisplayName(element, env, this.currentLang())} [${index}]`,
                type: 'A',
                include: [
                    'RoleOfContactPerson',
                    'NationalCode',
                    'Language',
                    'TimeZone',
                    'CityTown',
                    'Company',
                    'Department',
                    {
                        type: 'join',
                        idShortPath: 'Phone',
                        join: ['TypeOfTelephone', 'TelephoneNumber', 'AvailableTime'],
                        separator: ', ',
                    },
                    'Fax',
                    'Email',
                    'IPCommunication{00}',
                    'Street',
                    'Zipcode',
                    'POBox',
                    'ZipCodeOfPOBox',
                    'StateCounty',
                    {
                        type: 'join',
                        join: ['AcademicTitle', 'Title', 'FirstName', 'MiddleNames', 'NameOfContact'],
                        separator: ' ',
                    },
                    'FurtherDetailsOfContact',
                    'AddressOfAdditionalLink',
                ],
            });

            if (dataSheet.items.length > 0) {
                contacts.push(dataSheet);
                ++index;
            }
        }

        return contacts;
    });

    public update(newState: Partial<ContactInformationData>): void {
        if (newState.document !== undefined) {
            this.document$.set(newState.document);
        }
    }
}
