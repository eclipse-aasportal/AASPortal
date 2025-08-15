/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { Nameplate } from '../../../lib/views/nameplate/nameplate';
import { FakeLoader } from '../../mocks';

describe('Nameplate', () => {
    let component: Nameplate;
    let fixture: ComponentFixture<Nameplate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                Nameplate,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            providers: [provideZonelessChangeDetection()],
        }).compileComponents();

        fixture = TestBed.createComponent(Nameplate);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
