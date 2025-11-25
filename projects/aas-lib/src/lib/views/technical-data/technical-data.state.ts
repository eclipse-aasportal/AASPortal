/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, getReferable, isSubmodelElementCollection } from 'aas-core';
import { ChildState } from '../../components/child-state';
import { DataSheetData } from '../../types';
import { TECHNICAL_DATA_1_2 } from '../views-constants';
import { createDataSheet, findSubmodel } from '../../utilities';

export interface TechnicalDataData {
    document: AASDocument | null;
    submodel: aas.Submodel | null;
    dataSheets: DataSheetData[];
}

const initialState: TechnicalDataData = {
    document: null,
    submodel: null,
    dataSheets: [],
};

/**
 * Manages the state for technical data views, including the AAS document,
 * submodel, and generated data sheets. Handles updates and reacts to changes
 * in language and document/submodel.
 *
 * @extends ChildState<TechnicalDataData>
 */
@Injectable()
export class TechnicalDataState extends ChildState {
    private readonly document$ = signal(initialState.document);
    private readonly submodel$ = signal(initialState.submodel);
    private readonly dataSheets$ = signal(initialState.dataSheets);

    /**
     * Readonly signal for the current AAS document.
     */
    public readonly document = this.document$.asReadonly();

    /**
     * Readonly signal for the current list of data sheets.
     */
    public readonly dataSheets = this.dataSheets$.asReadonly();

    public constructor() {
        super(inject(TranslateService));

        effect(() => {
            const document = this.document$();
            if (!document) {
                return;
            }

            const submodel = findSubmodel(document, [TECHNICAL_DATA_1_2]);
            if (!submodel) {
                return;
            }

            this.update({ dataSheets: this.createDataSheets(document, submodel) });
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

    /**
     * Updates the state with new document, submodel, or data sheets.
     * Triggers signals and recalculates data sheets if necessary.
     *
     * @param newState Partial state to update.
     */
    public update(newState: Partial<TechnicalDataData>): void {
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

        const generalInfo = getReferable(submodel, 'GeneralInformation');
        if (generalInfo) {
            const dataSheet = createDataSheet(document, generalInfo, this.translate.getCurrentLang());
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        const productClassifications = getReferable(submodel, 'ProductClassifications');
        if (isSubmodelElementCollection(productClassifications) && productClassifications.value) {
            for (const item of productClassifications.value) {
                const dataSheet = createDataSheet(document, item, this.translate.getCurrentLang());
                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                }
            }
        }

        const technicalProperties = getReferable(submodel, 'TechnicalProperties');
        if (isSubmodelElementCollection(technicalProperties) && technicalProperties.value) {
            for (const item of technicalProperties.value) {
                const dataSheet = createDataSheet(document, item, this.translate.getCurrentLang());
                if (dataSheet.items.length > 0) {
                    dataSheets.push(dataSheet);
                }
            }
        }

        const furtherInfo = getReferable(submodel, 'FurtherInformation');
        if (furtherInfo) {
            const dataSheet = createDataSheet(document, furtherInfo, this.translate.getCurrentLang());
            if (dataSheet.items.length > 0) {
                dataSheets.push(dataSheet);
            }
        }

        return dataSheets;
    }
}
