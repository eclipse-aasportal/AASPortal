/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TestBed } from '@angular/core/testing';
import { aas, AASDocument, selectElement } from 'aas-core';
import cloneDeep from 'lodash-es/cloneDeep';
import { UpdateElementCommand } from '../../app/aas/commands/update-element-command';
import { sampleDocument } from '../../test/assets/sample-document';
import { AASStore } from '../../app/aas/aas.store';
import { NotifyService } from 'aas-lib';
import { AASApiService } from '../../app/aas/aas-api.service';

describe('SetValueCommand', function () {
    let command: UpdateElementCommand;
    let store: AASStore;
    let document: AASDocument;
    let property: aas.Property;
    let element: aas.Property;

    beforeEach(function () {
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
                    provide: AASApiService,
                    useValue: jasmine.createSpyObj<AASApiService>(['getContent', 'getDocument', 'putDocument']),
                },
            ],
        });

        store = TestBed.inject(AASStore);
        store.document$.set(document);
    });

    beforeEach(function () {
        command = new UpdateElementCommand(store, document, property, element);
        command.execute();
    });

    it('can be executed', () => {
        const document = store.document$();
        const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
        expect(value.value).toEqual('42');
    });

    it('can be undone/redone', () => {
        {
            command.undo();
            const document = store.document$();
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('5000');
        }

        {
            command.redo();
            const document = store.document$();
            store;
            const value: aas.Property = selectElement(document!.content!, 'TechnicalData', 'MaxRotationSpeed')!;
            expect(value.value).toEqual('42');
        }
    });
});
