/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TestBed } from '@angular/core/testing';
import { aas, AASDocument, selectElement } from 'aas-core';
import { EndpointsApi, NotifyService } from 'aas-lib';
import { UpdateElementCommand } from '../../app/edit/commands/update-element-command';
import { sampleDocument } from '../assets/sample-document';
import { EditState } from '../../app/edit/edit.state';
import { createSpyObj, FakeLoader } from '../mocks';

describe('SetValueCommand', () => {
    let command: UpdateElementCommand;
    let state: EditState;
    let document: AASDocument;
    let property: aas.Property;
    let element: aas.Property;

    beforeEach(() => {
        document = cloneDeep(sampleDocument);
        property = selectElement(document.content!, 'TechnicalData', 'MaxRotationSpeed')!;
        element = cloneDeep(property);
        element.value = '42';

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

        state = TestBed.inject(EditState);
        state.update({ document });
    });

    beforeEach(() => {
        command = new UpdateElementCommand(state, document, property, element);
        command.execute();
    });

    it('can be executed', () => {
        const document = state.document();
        const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
        expect(value.value).toEqual('42');
    });

    it('can be undone/redone', () => {
        {
            command.undo();
            const document = state.document();
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('5000');
        }

        {
            command.redo();
            const document = state.document();
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('42');
        }
    });
});
