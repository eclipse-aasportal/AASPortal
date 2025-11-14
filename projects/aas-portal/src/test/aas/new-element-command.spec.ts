/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { aas, AASDocument, selectElement } from 'aas-core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import cloneDeep from 'lodash-es/cloneDeep';
import { EndpointsApi, NotifyService } from 'aas-lib';
import { aasNoTechnicalData, submodelTechnicalData } from '../../test/assets/sample-document';
import { NewElementCommand } from '../../app/aas/commands/new-element-command';
import { AASState } from '../../app/aas/aas.state';
import { createSpyObj, FakeLoader } from '../mocks';

describe('NewElementCommand', () => {
    let command: NewElementCommand;
    let document: AASDocument;
    let submodel: aas.Submodel;
    let state: AASState;

    beforeEach(() => {
        document = cloneDeep(aasNoTechnicalData);
        submodel = cloneDeep(submodelTechnicalData);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: EndpointsApi,
                    useValue: createSpyObj<EndpointsApi>(['getContent', 'getDocument', 'putDocument']),
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        });

        state = TestBed.inject(AASState);
        state.update({ document });
    });

    beforeEach(() => {
        command = new NewElementCommand(state, document, document.content!.assetAdministrationShells[0], submodel);
        command.execute();
    });

    it('can be executed', () => {
        const document = state.document();
        const element = selectElement(document!.content!, 'TechnicalData');
        expect(element).toBeDefined();
    });

    it('can be undone/redone', () => {
        {
            command.undo();
            const document = state.document();
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeUndefined();
        }

        {
            command.redo();
            const document = state.document();
            const element = selectElement(document!.content!, 'TechnicalData');
            expect(element).toBeDefined();
        }
    });
});
