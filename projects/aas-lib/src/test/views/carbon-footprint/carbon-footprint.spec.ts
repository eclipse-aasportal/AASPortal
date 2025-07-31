/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { aas, AASDocument } from 'aas-core';
import { CarbonFootprint } from '../../../lib/views/carbon-footprint/carbon-footprint';
import { WINDOW, WindowService } from '../../../lib/services/window.service';

import carbon_footprint_1_0 from '../../assets/carbon-footprint-1-0.json';
import { CARBON_FOOTPRINT_1_0 } from '../../../lib/views/views';

describe('CarbonFootprint', () => {
    let component: CarbonFootprint;
    let fixture: ComponentFixture<CarbonFootprint>;
    let window: jasmine.SpyObj<WindowService>;
    let document: AASDocument;

    beforeEach(async () => {
        window = jasmine.createSpyObj<WindowService>(['open'], {
            location: { toString: () => 'https://www.fraunhofer.de' } as Location,
        });

        document = {
            address: '',
            crc32: 0,
            idShort: 'CarbonFootprint',
            readonly: false,
            timestamp: 0,
            id: 'https://admin-shell.io/idta/aas/CarbonFootprintAAS/1/0',
            endpoint: 'Test',
            content: carbon_footprint_1_0 as aas.Environment,
        };

        await TestBed.configureTestingModule({
            imports: [
                CarbonFootprint,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [
                {
                    provide: WINDOW,
                    useValue: window,
                },
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CarbonFootprint);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should has a submodel', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.submodel()).toBeDefined();
    });

    it('should has a semanticId', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.semanticId()).toEqual(CARBON_FOOTPRINT_1_0);
    });

    it('should has document items', () => {
        fixture.componentRef.setInput('document', document);
        fixture.detectChanges();
        expect(component.items()).toBeDefined();
    });
});
