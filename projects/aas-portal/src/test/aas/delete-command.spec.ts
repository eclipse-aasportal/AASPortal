/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { aas, AASDocument, selectElement } from 'aas-core';
import cloneDeep from 'lodash-es/cloneDeep';
import { NotifyService } from 'aas-lib';
import { DeleteCommand } from '../../app/aas/commands/delete-command';
import { sampleDocument } from '../../test/assets/sample-document';
import { AASStore } from '../../app/aas/aas.store';
import { AASApiService } from '../../app/aas/aas-api.service';

describe('DeleteCommand', () => {
    let command: DeleteCommand;
    let store: AASStore;
    let document: AASDocument;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: AASApiService,
                    useValue: jasmine.createSpyObj<AASApiService>(['getContent', 'getDocument', 'putDocument']),
                },
            ],
        });

        store = TestBed.inject(AASStore);
        document = cloneDeep(sampleDocument);
        store.document$.set(document);
    });

    describe('delete Submodel', () => {
        let submodel: aas.Submodel;

        beforeEach(() => {
            submodel = selectElement(document!.content!, 'TechnicalData')!;
            command = new DeleteCommand(store, document, submodel);
            command.execute();
        });

        it('can be executed', () => {
            const document = store.document$();
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeUndefined();
            const submodels = document?.content?.assetAdministrationShells[0].submodels;
            const reference = submodels?.find(r => r.keys[0].value === submodel.id);
            expect(reference).toBeUndefined();
        });

        it('can be undone/redone', () => {
            {
                command.undo();
                const document = store.document$();
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeDefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeDefined();
            }

            {
                command.redo();
                const document = store.document$();
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeUndefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeUndefined();
            }
        });
    });

    describe('delete Property', () => {
        let property: aas.Property;

        beforeEach(() => {
            property = selectElement(document.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            command = new DeleteCommand(store, document, property);
            command.execute();
        });

        it('can be executed', () => {
            const document = store.document$();
            const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
            expect(element).toBeUndefined();
        });

        it('can be undone/redone', () => {
            {
                command.undo();
                const document = store.document$();
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeDefined();
            }

            {
                command.redo();
                const document = store.document$();
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeUndefined();
            }
        });
    });
});