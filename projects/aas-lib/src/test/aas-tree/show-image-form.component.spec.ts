/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ShowImageFormComponent } from '../../lib/aas-tree/show-image-form/show-image-form.component';
import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    standalone: true,
})
class TestSecureImageComponent {
    @Input()
    public src = '';
    @Input()
    public alt?: string;
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
            providers: [
                {
                    provide: NgbActiveModal,
                    useValue: jasmine.createSpyObj<NgbActiveModal>(['close', 'dismiss']),
                },
            ],

            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
        });

        TestBed.overrideComponent(ShowImageFormComponent, {
            remove: {
                imports: [SecuredImageComponent],
            },
            add: {
                imports: [TestSecureImageComponent],
            },
        });

        fixture = TestBed.createComponent(ShowImageFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
