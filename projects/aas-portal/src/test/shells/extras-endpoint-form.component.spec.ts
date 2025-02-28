/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ExtrasEndpointFormComponent } from '../../app/shells/extras-endpoint-form/extras-endpoint-form.component';
import { ExtrasEndpointService } from '../../app/shells/extras-endpoint-form/extras-endpoint.service';

describe('ExtrasEndpointFormComponent', () => {
    let component: ExtrasEndpointFormComponent;
    let fixture: ComponentFixture<ExtrasEndpointFormComponent>;
    let service: jasmine.SpyObj<ExtrasEndpointService>;

    beforeEach(async () => {
        service = jasmine.createSpyObj<ExtrasEndpointService>(['getDocumentCount', 'getEndpoints', 'reset', 'scan']);
        service.getEndpoints.and.returnValue(
            of([
                { name: 'Endpoint 1', url: 'http://endpoint/1', type: 'AAS_API', schedule: { type: 'manual' } },
                { name: 'Endpoint 2', url: 'http://endpoint/2', type: 'AAS_API' },
            ]),
        );

        service.getDocumentCount.and.returnValue(of(42));
        service.reset.and.returnValue(of(void 0));
        service.scan.and.returnValue(of(void 0));

        await TestBed.configureTestingModule({
            providers: [NgbActiveModal],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();

        TestBed.overrideComponent(ExtrasEndpointFormComponent, {
            remove: {
                providers: [ExtrasEndpointService],
            },
            add: {
                providers: [{ provide: ExtrasEndpointService, useValue: service }],
            },
        });

        fixture = TestBed.createComponent(ExtrasEndpointFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows 2 endpoints', () => {
        expect(component.endpoints()).toEqual([
            { name: 'Endpoint 1', url: 'http://endpoint/1', count: 42, schedule: 'manual' },
            { name: 'Endpoint 2', url: 'http://endpoint/2', count: 42, schedule: 'every' },
        ]);
    });

    it('provides a reset', () => {
        component.reset();
        expect(service.reset).toHaveBeenCalled();
    });

    it('manually starts an endpoint scan', () => {
        component.scan('Endpoint 1');
        expect(service.scan).toHaveBeenCalledWith('Endpoint 1');
    });
});