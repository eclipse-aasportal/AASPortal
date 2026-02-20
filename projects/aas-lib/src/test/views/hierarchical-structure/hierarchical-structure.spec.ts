/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { aas, AASDocument } from 'aas-core';

import { createSpyObj, FakeLoader } from '../../mocks';
import { EndpointsApi } from '../../../lib/services/endpoints-api';
import { HierarchicalStructure } from '../../../lib/views/hierarchical-structure/hierarchical-structure';
import { VIEW_ROUTES } from '../../../lib/views/views-routes';

import hierarchicalStructures_1_1 from '../../assets/hierarchical-structures-1-1.json';

describe('HierarchicalStructure', () => {
    let component: HierarchicalStructure;
    let fixture: ComponentFixture<HierarchicalStructure>;
    let api: Mocked<EndpointsApi>;
    let document: AASDocument;

    beforeEach(async () => {
        api = createSpyObj<EndpointsApi>(['getDocument', 'getContent']);
        document = {
            address: '',
            crc32: 0,
            idShort: 'BillofMaterialAAS',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/HierarchicalStructuresBoM/1/1',
            endpoint: 'Test',
            content: hierarchicalStructures_1_1 as aas.Environment,
        };

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: VIEW_ROUTES,
                    useValue: [],
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [HierarchicalStructure],
        }).compileComponents();

        fixture = TestBed.createComponent(HierarchicalStructure);
        fixture.componentRef.setInput('document', document);
        fixture.componentRef.setInput('submodel', hierarchicalStructures_1_1.submodels[0]);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.document()).toBe(document);
        expect(component.submodel()).toBe(hierarchicalStructures_1_1.submodels[0]);
    });

    it('should have 3 nodes', () => {
        expect(component.tree()).toEqual([]);
    });
});
