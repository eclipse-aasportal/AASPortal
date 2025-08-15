/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import cloneDeep from 'lodash-es/cloneDeep';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { aas, AASDocument, selectElement } from 'aas-core';
import { EndpointsApi, NotifyService } from 'aas-lib';
import { UpdateElementCommand } from '../../app/aas/commands/update-element-command';
import { sampleDocument } from '../../test/assets/sample-document';
import { AASState } from '../../app/aas/aas.state';

describe('SetValueCommand', () => {
    let command: UpdateElementCommand;
    let state: AASState;
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
