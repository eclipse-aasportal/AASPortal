/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from "@angular/core/testing";
import { Store, StoreModule } from "@ngrx/store";
import { first } from 'rxjs';
import { aas, AASDocument, selectElement } from "common";
import { aasReducer } from "../../app/aas/aas.reducer";
import { DeleteCommand } from "../../app/aas/commands/delete-command";
import { sampleDocument } from "../../test/assets/sample-document";
import { cloneDeep } from "lodash-es";
import { State } from "../../app/aas/aas.state";

describe('DeleteCommand', function () {
    let command: DeleteCommand;
    let store: Store<State>;
    let document: AASDocument;

    beforeEach(function () {
        document = cloneDeep(sampleDocument);

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

    describe('delete Submodel', function () {
        let submodel: aas.Submodel;

        beforeEach(function () {
            submodel = selectElement(document!.content!, 'TechnicalData')!;
            command = new DeleteCommand(store, document, submodel);
            command.execute();
        });

        it('can be executed', function (done: DoneFn) {
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeUndefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeUndefined();
                done();
            });
        });

        it('can be undone/redone', function (done: DoneFn) {
            command.undo();
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeDefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeDefined();
            });

            command.redo();
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeUndefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeUndefined();
                done();
            });
        });
    });

    describe('delete Property', function () {
        let property: aas.Property;

        beforeEach(function () {
            property = selectElement(document.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            command = new DeleteCommand(store, document, property);
            command.execute();
        });

        it('can be executed', function (done: DoneFn) {
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeUndefined();
                done();
            });
        });

        it('can be undone/redone', function (done: DoneFn) {
            command.undo();
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeDefined();
            });

            command.redo();
            store.select(state => state.aas.document).pipe(first()).subscribe(document => {
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeUndefined();
                done();
            });
        });
    });
});