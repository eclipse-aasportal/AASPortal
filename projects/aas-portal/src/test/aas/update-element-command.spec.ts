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
import { UpdateElementCommand } from '../../app/aas/commands/update-element-command';
import { sampleDocument } from '../../test/assets/sample-document';
import { State } from '../../app/aas/aas.state';

describe('SetValueCommand', function () {
    let command: UpdateElementCommand;
    let store: Store<State>;
    let document: AASDocument;
    let property: aas.Property;
    let element: aas.Property;

    beforeEach(function () {
        document = cloneDeep(sampleDocument);
        property = selectElement(document.content!, 'TechnicalData', 'MaxRotationSpeed')!;
        element = cloneDeep(property);
        element.value = '42';

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
        command = new UpdateElementCommand(store, document, property, element);
        command.execute();
    });

    it('can be executed', function (done: DoneFn) {
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('42');
            done();
        });
    });

    it('can be undone/redone', function (done: DoneFn) {
        command.undo();
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('5000');
        });

        command.redo();
        store.select(state => state.aas.document).pipe(first()).subscribe(document => {
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('42');
            done();
        });
    });
});