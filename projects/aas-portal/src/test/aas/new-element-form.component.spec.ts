/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NewElementFormComponent } from '../../app/aas/new-element-form/new-element-form.component';
import { TemplateService } from 'aas-lib';
import { signal } from '@angular/core';
import { TemplateDescriptor } from 'aas-core';

describe('NewElementFormComponent', () => {
    let component: NewElementFormComponent;
    let fixture: ComponentFixture<NewElementFormComponent>;
    let api: jasmine.SpyObj<TemplateService>;

    beforeEach(() => {
        api = jasmine.createSpyObj<TemplateService>(['getTemplate'], { templates: signal<TemplateDescriptor[]>([]) });

        TestBed.configureTestingModule({
            providers: [NgbActiveModal, { provide: TemplateService, useValue: api }],
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        fixture = TestBed.createComponent(NewElementFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});