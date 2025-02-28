/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ShowImageFormComponent } from '../../lib/show-image-form/show-image-form.component';
import { SecuredImageComponent } from '../../lib/secured-image/secured-image.component';

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    standalone: true,
})
class TestSecureImageComponent {
    public readonly src = input.required<string>();
    public readonly alt = input<string | undefined>();
    public readonly classname = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
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