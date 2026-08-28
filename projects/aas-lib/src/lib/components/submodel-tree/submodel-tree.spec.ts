/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';

import { aas } from 'aas-core';
import { SubmodelTree } from './submodel-tree';
import { WebSocketService } from '../../shared/services/web-socket.service';
import { createSpyObj, FakeLoader } from '../../../test/mocks';

describe('SubmodelTree', () => {
    let component: SubmodelTree;
    let fixture: ComponentFixture<SubmodelTree>;

    // ProductImages-shaped: a SubmodelElementList whose two items are anonymous
    // SubmodelElementCollections (no idShort, as required by the AAS spec for list items), each
    // holding a Property with the same idShort but a different value.
    const submodel: aas.Submodel = {
        modelType: 'Submodel',
        id: 'https://example.com/submodel/Test',
        idShort: 'TestSubmodel',
        submodelElements: [
            {
                idShort: 'Images',
                modelType: 'SubmodelElementList',
                typeValueListElement: 'SubmodelElementCollection',
                value: [
                    {
                        modelType: 'SubmodelElementCollection',
                        value: [
                            {
                                idShort: 'ImageFile',
                                modelType: 'Property',
                                valueType: 'xs:string',
                                value: 'first.jpg',
                            } as aas.Property,
                        ],
                    } as unknown as aas.SubmodelElementCollection,
                    {
                        modelType: 'SubmodelElementCollection',
                        value: [
                            {
                                idShort: 'ImageFile',
                                modelType: 'Property',
                                valueType: 'xs:string',
                                value: 'second.jpg',
                            } as aas.Property,
                        ],
                    } as unknown as aas.SubmodelElementCollection,
                ],
            } as aas.SubmodelElementList,
        ],
    };

    beforeEach(async () => {
        const webSocket = createSpyObj<WebSocketService>(['sendMessage', 'getMessages']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: WebSocketService, useValue: webSocket },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
            imports: [SubmodelTree],
        }).compileComponents();

        fixture = TestBed.createComponent(SubmodelTree);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('submodel', submodel);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('gives each anonymous list item its own, unique path', () => {
        const paths = component.groups().map(group => group.path);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it('does not let sibling list items overwrite each other\'s items', () => {
        const listItemGroups = component.groups().filter(group => group.level === 2);
        expect(listItemGroups.length).toBe(2);

        const values = listItemGroups.map(group => component.itemsOf(group.path).map(item => item.value()));
        expect(values).toEqual([['first.jpg'], ['second.jpg']]);
    });

    it('keeps sibling collections unique even when they repeat the same idShort', () => {
        // Some real-world exports repeat the same idShort across sibling collections (e.g.
        // multiple "component receptacle" entries), which the AAS spec forbids but which still
        // shows up in practice.
        const receptacleSubmodel: aas.Submodel = {
            modelType: 'Submodel',
            id: 'https://example.com/submodel/Receptacles',
            idShort: 'Receptacles',
            submodelElements: [
                {
                    idShort: 'AAQ661_component_receptacle',
                    modelType: 'SubmodelElementCollection',
                    value: [
                        { idShort: 'Label', modelType: 'Property', valueType: 'xs:string', value: 'A' } as aas.Property,
                    ],
                } as aas.SubmodelElementCollection,
                {
                    idShort: 'AAQ661_component_receptacle',
                    modelType: 'SubmodelElementCollection',
                    value: [
                        { idShort: 'Label', modelType: 'Property', valueType: 'xs:string', value: 'B' } as aas.Property,
                    ],
                } as aas.SubmodelElementCollection,
            ],
        };

        fixture.componentRef.setInput('submodel', receptacleSubmodel);
        fixture.detectChanges();

        const groups = component.groups().filter(group => group.idShort === 'AAQ661_component_receptacle');
        expect(groups.length).toBe(2);
        expect(new Set(groups.map(group => group.path)).size).toBe(2);

        const values = groups.map(group => component.itemsOf(group.path).map(item => item.value()));
        expect(values).toEqual([['A'], ['B']]);
    });
});
