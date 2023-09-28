/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { first, of } from 'rxjs';
import { SubmodelViewDescriptor, ViewQuery } from 'projects/aas-lib/src/public-api';
import { EffectsModule } from '@ngrx/effects';
import { AASLibModule, ClipboardService } from 'projects/aas-lib/src/public-api';

import { AppRoutingModule } from '../../app/app-routing.module';
import { viewReducer } from '../../app/view/view.reducer';
import { ViewState } from '../../app/view/view.state';
import { sampleDocument } from '../../test/assets/sample-document';
import { ViewComponent } from '../../app/view/view.component';
import { ProjectService } from '../../app/project/project.service';

describe('ViewComponent', () => {
    let component: ViewComponent;
    let fixture: ComponentFixture<ViewComponent>;
    let store: Store<{ view: ViewState }>;
    let project: jasmine.SpyObj<ProjectService>;
    let route: jasmine.SpyObj<ActivatedRoute>;
    let clipboard: ClipboardService;

    beforeEach(() => {
        project = jasmine.createSpyObj('ProjectService', ['getDocument']);
        project.getDocument.and.returnValue(of(sampleDocument));

        const descriptor: SubmodelViewDescriptor = {
            template: 'Nameplate',
            submodels: [{
                id: 'http://customer.com/aas/9175_7013_7091_9168',
                url: 'C:\\Git\\AASPortal\\data\\endpoints\\samples',
                idShort: 'Identification'
            }]
        }

        route = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', {}, {
            snapshot: jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                {},
                {
                    queryParams: {
                        format: 'ViewQuery'
                    }
                })
        });

        TestBed.configureTestingModule({
            declarations: [
                ViewComponent,
            ],
            providers: [
                {
                    provide: ProjectService,
                    useValue: project
                },
                {
                    provide: ActivatedRoute,
                    useValue: route
                }
            ],
            imports: [
                AppRoutingModule,
                CommonModule,
                AppRoutingModule,
                AASLibModule,
                EffectsModule.forRoot(),
                StoreModule.forRoot(
                    {
                        view: viewReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        store = TestBed.inject(Store);
        clipboard = TestBed.inject(ClipboardService);
        clipboard.set('ViewQuery', { descriptor } as ViewQuery);
        fixture = TestBed.createComponent(ViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('provides a view for a specific template view', function (done: DoneFn) {
        store.select(state => state.view).pipe(first()).subscribe(state => {
            expect(state.submodels[0].submodel.idShort).toEqual('Identification');
            expect(component.submodels[0].submodel.idShort).toEqual('Identification');
            done();
        })
    });
});