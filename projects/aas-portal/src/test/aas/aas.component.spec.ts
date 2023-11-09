/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AASDocument, aas } from 'common';
import { Observable, noop, of } from 'rxjs';
import { AASTree, DownloadService, NotifyService, OnlineState } from 'projects/aas-lib/src/public-api';
import { CommonModule } from '@angular/common';

import { AASComponent } from '../../app/aas/aas.component';
import { aasReducer } from '../../app/aas/aas.reducer';
import { rotationSpeed, sampleDocument, torque } from '../../test/assets/sample-document';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartType, DashboardPage } from '../../app/dashboard/dashboard.state';
import { Router } from '@angular/router';
import { AppRoutingModule } from '../../app/app-routing.module';
import { AASState } from '../../app/aas/aas.state';
import * as AASActions from '../../app/aas/aas.actions';
import { ProjectService } from '../../app/project/project.service';
import { Component, Input } from '@angular/core';

class TestProjectService implements Partial<ProjectService> {
    constructor(private document: AASDocument) { }

    public getDocument(): Observable<AASDocument> {
        return of(this.document);
    }
}

class TestDashboardService implements Partial<DashboardService> {
    public pages: Observable<DashboardPage[]> = of([]);
    public name: Observable<string> = of('Dashboard 1');
    public add(): void {
        noop();
    }
}

@Component({
    selector: 'fhg-aas-tree',
    template: '<div></div>',
    styleUrls: []
})
class TestAASTreeComponent implements AASTree {
    @Input()
    public state: OnlineState = 'offline';
    @Input()
    public document: AASDocument | null = null;
    @Input()
    public search: Observable<string> | null = null;

    public selectedElements: Observable<aas.Referable[]> = of([torque, rotationSpeed]);

    public findNext(): void {
        noop();
    }

    public findPrevious(): void {
        noop();
    }
}

@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: []
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

describe('AASComponent', () => {
    let component: AASComponent;
    let fixture: ComponentFixture<AASComponent>;
    let store: Store<{ aas: AASState }>;
    let dashboard: DashboardService;
    let router: Router;
    let download: DownloadService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AASComponent,
                TestAASTreeComponent,
                TestSecureImageComponent
            ],
            providers: [
                {
                    provide: ProjectService,
                    useValue: new TestProjectService(sampleDocument)
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error'])
                },
                {
                    provide: DashboardService,
                    useValue: new TestDashboardService()
                }
            ],
            imports: [
                CommonModule,
                AppRoutingModule,
                HttpClientTestingModule,
                NgbModule,
                StoreModule.forRoot(
                    {
                        aas: aasReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        fixture = TestBed.createComponent(AASComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        dashboard = TestBed.inject(DashboardService);
        router = TestBed.inject(Router);
        download = TestBed.inject(DownloadService);
        store.dispatch(AASActions.setDocument({ document: sampleDocument }));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows a document overview', function () {
        const aas = sampleDocument.content!.assetAdministrationShells[0];
        const assetId = aas.assetInformation.globalAssetId ?? '-';

        expect(component.address).toEqual(sampleDocument.address);
        expect(component.idShort).toEqual(sampleDocument.idShort);
        expect(component.id).toEqual(sampleDocument.id);
        expect(component.version).toEqual('-');
        expect(component.assetId).toEqual(assetId);
    });

    it('indicates that the sample AAS is not online ready', function () {
        expect(component.onlineReady).toBeFalse();
    });

    it('indicates that the sample AAS is editable', function () {
        expect(component.readonly).toBeFalse();
    });

    it('can add the selected properties to the dashboard', async function () {
        spyOn(dashboard, 'add');
        spyOn(router, 'navigateByUrl').and.resolveTo(true);
        expect(component.canAddToDashboard()).toBeTrue();
        await expectAsync(component.addToDashboard(DashboardChartType.BarVertical)).toBeResolvedTo(true);
        expect(dashboard.add).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalled();
    });

    it('can download an AASX file', function () {
        spyOn(download, 'downloadDocument').and.returnValue(of(void 0));
        expect(component.canDownloadDocument()).toBeTrue();
        component.downloadDocument();
        expect(download.downloadDocument).toHaveBeenCalled();
    });
});