/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AASDocument } from 'common';

import { AppRoutingModule } from '../../app/app-routing.module';
import { MainComponent } from '../../app/main/main.component';
import { AASLibModule } from 'projects/aas-lib/src/public-api';
import { MainApiService } from '../../app/main/main-api.service';

describe('MainComponent', () => {
    let component: MainComponent;
    let fixture: ComponentFixture<MainComponent>;
    let documentSubject: Subject<AASDocument | null>;
    let api: jasmine.SpyObj<MainApiService>;

    beforeEach(() => {
        documentSubject = new Subject<AASDocument | null>();
        documentSubject.next(null);
        api = jasmine.createSpyObj<MainApiService>('ProjectService', ['getDocument']);

        TestBed.configureTestingModule({
            declarations: [
                MainComponent
            ],
            providers: [
                {
                    provide: MainApiService,
                    useValue: api
                }
            ],
            imports: [
                CommonModule,
                AppRoutingModule,
                NgbModule,
                AASLibModule,
                EffectsModule.forRoot(),
                StoreModule.forRoot(),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(MainComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a list of route links', function () {
        expect(component.links).toBeDefined();
        expect(component.links.map(link => link.url)).toEqual(['/start', '/aas', '/view', '/dashboard', '/about']);
    });
});