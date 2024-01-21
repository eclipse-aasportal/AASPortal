/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { first } from 'rxjs';
import { aas, AASDocument, selectElement } from 'common';
import { cloneDeep } from 'lodash-es';
import { aasReducer } from '../../app/aas/aas.reducer';
import { aasNoTechnicalData, submodelTechnicalData } from '../../test/assets/sample-document';
import { NewElementCommand } from '../../app/aas/commands/new-element-command';
import { AASState } from '../../app/aas/aas.state';

describe('NewElementCommand', function () {
    let command: NewElementCommand;
    let store: Store<{ aas: AASState }>;
    let document: AASDocument;
    let submodel: aas.Submodel;

    beforeEach(function () {
        document = cloneDeep(aasNoTechnicalData);
        submodel = cloneDeep(submodelTechnicalData);

        TestBed.configureTestingModule({
            declarations: [],
            providers: [
            ],
            imports: [
                StoreModule.forRoot(
                    {
                        aas: aasReducer
                    }),
            ]
        });

        store = TestBed.inject(Store);
    });

    beforeEach(function () {
        command = new NewElementCommand(store, document, document.content!.assetAdministrationShells[0], submodel);
        command.execute();
    });

    it('can be executed', function (done: DoneFn) {
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeDefined();
            done();
        });
    });

    it('can be undone/redone', function (done: DoneFn) {
        command.undo();
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeUndefined();
        });

        command.redo();
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeDefined();
            done();
        });
    });
});