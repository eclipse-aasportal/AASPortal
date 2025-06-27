/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { UpdateEndpointFormComponent } from '../../app/shells/update-endpoint-form/update-endpoint-form.component';

describe('UpdateEndpointFormComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [NgbActiveModal, provideZonelessChangeDetection()],
            imports: [
                UpdateEndpointFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        }).compileComponents();
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(UpdateEndpointFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});