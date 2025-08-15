/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TemplateService } from 'aas-lib';
import { TemplateDescriptor } from 'aas-core';
import { NewElementFormComponent } from '../../app/aas/new-element-form/new-element-form.component';
import { FakeLoader } from '../mocks';

describe('NewElementFormComponent', () => {
    let api: jasmine.SpyObj<TemplateService>;

    beforeEach(async () => {
        api = jasmine.createSpyObj<TemplateService>(['getTemplate'], { templates: signal<TemplateDescriptor[]>([]) });

        await TestBed.configureTestingModule({
            providers: [NgbActiveModal, { provide: TemplateService, useValue: api }, provideZonelessChangeDetection()],
            imports: [
                NewElementFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(NewElementFormComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });
});
