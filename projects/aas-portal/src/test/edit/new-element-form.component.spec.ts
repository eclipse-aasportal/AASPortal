/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TemplateService } from 'aas-lib';
import { NewElementFormComponent } from '../../app/edit/new-element-form/new-element-form.component';
import { createSpyObj, FakeLoader } from '../mocks';

describe('NewElementFormComponent', () => {
    let api: jest.Mocked<TemplateService>;

    beforeEach(async () => {
        api = createSpyObj<TemplateService>(['getTemplate'], { templates: signal<string[]>([]) });

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
