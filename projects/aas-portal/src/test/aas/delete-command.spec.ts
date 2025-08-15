/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { aas, AASDocument, selectElement } from 'aas-core';
import cloneDeep from 'lodash-es/cloneDeep';
import { EndpointsApi, NotifyService } from 'aas-lib';
import { DeleteCommand } from '../../app/aas/commands/delete-command';
import { sampleDocument } from '../../test/assets/sample-document';
import { AASState } from '../../app/aas/aas.state';

describe('DeleteCommand', () => {
    let command: DeleteCommand;
    let state: AASState;
    let document: AASDocument;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: EndpointsApi,
                    useValue: jasmine.createSpyObj<EndpointsApi>(['getContent', 'getDocument', 'putDocument']),
                },
                provideZonelessChangeDetection(),
            ],
        });

        state = TestBed.inject(AASState);
        document = cloneDeep(sampleDocument);
        state.update({ document });
    });

    describe('delete Submodel', () => {
        let submodel: aas.Submodel;

        beforeEach(() => {
            submodel = selectElement(document!.content!, 'TechnicalData')!;
            command = new DeleteCommand(state, document, submodel);
            command.execute();
        });

        it('can be executed', () => {
            const document = state.document();
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeUndefined();
            const submodels = document?.content?.assetAdministrationShells[0].submodels;
            const reference = submodels?.find(r => r.keys[0].value === submodel.id);
            expect(reference).toBeUndefined();
        });

        it('can be undone/redone', () => {
            {
                command.undo();
                const document = state.document();
                const element = selectElement(document!.content!, 'TechnicalData');
                expect(element).toBeDefined();
                const submodels = document?.content?.assetAdministrationShells[0].submodels;
                const reference = submodels?.find(r => r.keys[0].value === submodel.id);
                expect(reference).toBeDefined();
            }

            {
                command.redo();
                const document = state.document();
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
            command = new DeleteCommand(state, document, property);
            command.execute();
        });

        it('can be executed', () => {
            const document = state.document();
            const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
            expect(element).toBeUndefined();
        });

        it('can be undone/redone', () => {
            {
                command.undo();
                const document = state.document();
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeDefined();
            }

            {
                command.redo();
                const document = state.document();
                const element = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed');
                expect(element).toBeUndefined();
            }
        });
    });
});
