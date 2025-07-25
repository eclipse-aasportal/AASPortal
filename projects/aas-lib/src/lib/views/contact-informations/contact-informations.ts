/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { AASDocument, getSemanticId } from 'aas-core';
import { CONTACT_INFORMATIONS_1_0 } from '../views';
import { DataSheetData } from '../../types';
import { createDataSheet, getDisplayName } from '../../utilities';

@Component({
    selector: 'fhg-contact-informations',
    imports: [NgbAccordionModule],
    templateUrl: './contact-informations.html',
    styleUrl: './contact-informations.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactInformations {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(translate: TranslateService) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);
    }

    public readonly document = input<AASDocument>();

    private readonly submodel = computed(() => {
        const env = this.document()?.content;
        if (!env) {
            return undefined;
        }

        return env.submodels.find(submodel => getSemanticId(submodel) === CONTACT_INFORMATIONS_1_0);
    });

    public readonly contacts = computed(() => {
        const contacts: DataSheetData[] = [];
        const currentLang = this.currentLang();
        const document = this.document();
        const submodel = this.submodel();
        const env = document?.content;
        if (!env || !submodel?.submodelElements) {
            return contacts;
        }

        let index = 1;
        for (const element of submodel.submodelElements) {
            const dataSheet = createDataSheet(document, submodel, element, currentLang, {
                name: `${getDisplayName(element, env, currentLang)} [${index}]`,
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
}
