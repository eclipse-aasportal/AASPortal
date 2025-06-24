/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
    AASTreeComponent,
    AuthService,
    DocumentsService,
    DownloadService,
    NotifyService,
    OnlineState,
    SecuredImageComponent,
    StartService,
    ToolbarService,
} from 'aas-lib';

import { AASDocument, aas, noop } from 'aas-core';
import { AASComponent } from '../../app/aas/aas.component';
import { rotationSpeed, sampleDocument, torque } from '../assets/sample-document';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { ChangeDetectionStrategy, Component, input, output, provideZonelessChangeDetection, signal } from '@angular/core';
import { AASStore } from '../../app/aas/aas.store';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartType, DashboardPage } from '../../app/dashboard/dashboard-types';

@Component({
    selector: 'fhg-aas-tree',
    template: '<div></div>',
    styleUrls: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestAASTreeComponent {
    public document = input<AASDocument | null>(null);
    public state = input<OnlineState | null>('offline');
    public searchExpression = input('');
    public selected = input<aas.Referable[]>([torque, rotationSpeed]);
    public selectedChange = output<aas.Referable[]>();

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
    styleUrls: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestSecureImageComponent {
    public readonly src = input.required<string>();
    public readonly alt = input<string | undefined>();
    public readonly classname = input<string | undefined>();
    public readonly width = input<number | undefined>();
    public readonly height = input<number | undefined>();
}

describe('AASComponent', () => {
    let component: AASComponent;
    let fixture: ComponentFixture<AASComponent>;
    let dashboard: jasmine.SpyObj<DashboardService>;
    let router: Router;
    let store: AASStore;
    let api: jasmine.SpyObj<DocumentsService>;
    let download: jasmine.SpyObj<DownloadService>;
    let start: jasmine.SpyObj<StartService>;
    let pages: DashboardPage[];

    beforeEach(() => {
        pages = [{ name: 'Dashboard 1', items: [], requests: [], active: true }];

        api = jasmine.createSpyObj<DocumentsService>(['getDocument', 'putDocument']);
        download = jasmine.createSpyObj<DownloadService>(['downloadPackage', 'download', 'uploadPackages']);
        dashboard = jasmine.createSpyObj<DashboardService>(['addChart'], {
            activePage: signal(pages[0]).asReadonly(),
            pages: signal(pages).asReadonly(),
        });

        start = jasmine.createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        start.save.and.returnValue(of(void 0));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DocumentsService,
                    useValue: api,
                },
                {
                    provide: NotifyService,
                    useValue: jasmine.createSpyObj<NotifyService>(['error']),
                },
                {
                    provide: DashboardService,
                    useValue: dashboard,
                },
                {
                    provide: DownloadService,
                    useValue: download,
                },
                {
                    provide: ToolbarService,
                    useValue: jasmine.createSpyObj<ToolbarService>(['clear', 'set']),
                },
                {
                    provide: AuthService,
                    useValue: jasmine.createSpyObj<AuthService>(['ensureAuthorized']),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                provideHttpClientTesting(),
                provideRouter([]),
                provideZonelessChangeDetection(),
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

        TestBed.overrideComponent(AASComponent, {
            remove: {
                imports: [AASTreeComponent, SecuredImageComponent],
            },
            add: {
                imports: [TestAASTreeComponent, TestSecureImageComponent],
            },
        });

        fixture = TestBed.createComponent(AASComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(AASStore);
        router = TestBed.inject(Router);
        store.document$.set(sampleDocument);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the document address', () => {
        expect(component.address()).toEqual(sampleDocument.address);
    });

    it('shows the document assetId', () => {
        expect(component.assetId()).toEqual('http://customer.com/assets/KHBVZJSQKIY');
    });

    it('shows the document id', () => {
        expect(component.id()).toEqual(sampleDocument.id);
    });

    it('shows the document version', () => {
        expect(component.version()).toEqual('-');
    });

    it('indicates that "play" is disabled while sample AAS is not online ready', () => {
        expect(component.canPlay()).toBeFalse();
    });

    it('indicates that "stop" is disabled while sample AAS is not online ready', () => {
        expect(component.canStop()).toBeFalse();
    });

    it('indicates that the sample AAS is editable', () => {
        expect(component.readOnly()).toBeFalse();
    });

    describe('canAddToDashboard', () => {
        beforeEach(() => {
            component.selectedElements.set([torque, rotationSpeed]);
        });

        it('can add the selected properties to the dashboard', () => {
            spyOn(router, 'navigateByUrl').and.resolveTo(true);
            expect(component.canAddToDashboard()).toBeTrue();
            component.addToDashboard(DashboardChartType.BarVertical);
            expect(dashboard.addChart).toHaveBeenCalled();
            expect(router.navigateByUrl).toHaveBeenCalled();
        });
    });
});
