/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ShowImageFormComponent } from 'src/lib/aas-tree/show-image-form/show-image-form.component';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
})
class TestSecureImageComponent {
    @Input()
    public src = '';
    @Input()
    public alt?:string;
    @Input()
    public classname?: string;
    @Input()
    public width = -1;
    @Input()
    public height = -1;
}

describe('ShowImageFormComponent', () => {
    let component: ShowImageFormComponent;
    let fixture: ComponentFixture<ShowImageFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ShowImageFormComponent,
                TestSecureImageComponent
            ],
            providers: [
                NgbModal,
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
        
        fixture = TestBed.createComponent(ShowImageFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});