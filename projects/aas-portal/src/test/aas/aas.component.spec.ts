/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';

import { AASDocument, aas, noop } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    EndpointsApi,
    DownloadService,
    NotifyService,
    LiveState,
    SecuredImageComponent,
    StartService,
    ToolbarService,
} from 'aas-lib';

import { AASComponent } from '../../app/aas/aas.component';
import { rotationSpeed, sampleDocument, torque } from '../assets/sample-document';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartType, DashboardPage } from '../../app/dashboard/dashboard-types';
import { createSpyObj, FakeLoader } from '../mocks';
import { AASState } from '../../app/aas/aas.state';

@Component({
    selector: 'fhg-aas-tree',
    template: '<div></div>',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestAASTreeComponent {
    public document = input<AASDocument | null>(null);
    public state = input<LiveState | null>('offline');
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

describe('AASComponent', () => {
    let dashboard: jest.Mocked<DashboardService>;
    let router: Router;
    let api: jest.Mocked<EndpointsApi>;
    let download: jest.Mocked<DownloadService>;
    let start: jest.Mocked<StartService>;
    let pages: DashboardPage[];

    beforeEach(async () => {
        pages = [{ name: 'Dashboard 1', items: [], requests: [], active: true }];

        api = createSpyObj<EndpointsApi>(['getDocument', 'putDocument']);
        download = createSpyObj<DownloadService>(['downloadPackage', 'download', 'uploadPackages']);
        dashboard = createSpyObj<DashboardService>(['addChart'], {
            activePage: signal(pages[0]).asReadonly(),
            pages: signal(pages).asReadonly(),
        });

        start = createSpyObj<StartService>(['add', 'getType', 'remove', 'save']);
        start.save.mockReturnValue(of(void 0));

        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: EndpointsApi,
                    useValue: api,
                },
                {
                    provide: NotifyService,
                    useValue: createSpyObj<NotifyService>(['error']),
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
                    useValue: createSpyObj<ToolbarService>(['clear', 'set']),
                },
                {
                    provide: AuthService,
                    useValue: createSpyObj<AuthService>(['ensureAuthorized']),
                },
                {
                    provide: StartService,
                    useValue: start,
                },
                provideHttpClientTesting(),
                provideRouter([]),
                provideZonelessChangeDetection(),
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
            ],
            imports: [AASComponent],
        }).compileComponents();

        TestBed.overrideComponent(AASComponent, {
            remove: {
                imports: [AASTreeComponent],
            },
            add: {
                imports: [TestAASTreeComponent],
            },
        });

        router = TestBed.inject(Router);
        const state = TestBed.inject(AASState);
        state.update({ document: sampleDocument });
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component).toBeTruthy();
    });

    it('shows the document address', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.address()).toEqual(sampleDocument.address);
    });

    it('shows the document assetId', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.assetId()).toEqual('http://customer.com/assets/KHBVZJSQKIY');
    });

    it('shows the document id', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.id()).toEqual(sampleDocument.id);
    });

    it('shows the document version', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.version()).toEqual('-');
    });

    it('indicates that "play" is disabled while sample AAS is not online ready', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.canPlay()).toBe(false);
    });

    it('indicates that "stop" is disabled while sample AAS is not online ready', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.canStop()).toBe(false);
    });

    it('indicates that the sample AAS is editable', () => {
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
        expect(component.readOnly()).toBe(false);
    });

    describe('canAddToDashboard', () => {
        it('can add the selected properties to the dashboard', () => {
            const fixture = TestBed.createComponent(AASComponent);
            const component = fixture.componentInstance;
            component.setSelectedElements([torque, rotationSpeed]);
            jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
            expect(component.canAddToDashboard()).toBe(true);
            component.addToDashboard(DashboardChartType.BarVertical);
            expect(dashboard.addChart).toHaveBeenCalled();
            expect(router.navigateByUrl).toHaveBeenCalled();
        });
    });
});
