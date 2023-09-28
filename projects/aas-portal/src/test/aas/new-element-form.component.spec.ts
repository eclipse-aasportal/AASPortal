/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NewElementFormComponent } from '../../app/aas/new-element-form/new-element-form.component';

describe('NewElementFormComponent', () => {
    let component: NewElementFormComponent;
    let fixture: ComponentFixture<NewElementFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                NewElementFormComponent
            ],
            providers: [
                NgbActiveModal
            ],
            imports: [
                CommonModule,
                FormsModule,
                NgbModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(NewElementFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});