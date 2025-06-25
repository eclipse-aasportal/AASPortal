/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ToolbarService } from 'aas-lib';

import { ViewComponent } from '../../app/view/view.component';

describe('ViewComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set'], { toolbarTemplate: signal(null) }),
                },
                provideZonelessChangeDetection(),
            ],
            imports: [
                ViewComponent,
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
        const fixture = TestBed.createComponent(ViewComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });
});
