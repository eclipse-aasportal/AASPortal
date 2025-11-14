/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
<<<<<<< HEAD
import { TestBed } from '@angular/core/testing';
=======
import { ComponentFixture, TestBed } from '@angular/core/testing';
>>>>>>> development
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
<<<<<<< HEAD
=======
    DOCUMENT,
>>>>>>> development
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
<<<<<<< HEAD
    DownloadService,
    NotifyService,
    LiveState,
    SecuredImageComponent,
=======
    NotifyService,
    LiveState,
>>>>>>> development
    StartService,
    ToolbarService,
} from 'aas-lib';

import { AASComponent } from '../../app/aas/aas.component';
<<<<<<< HEAD
import { rotationSpeed, sampleDocument, torque } from '../assets/sample-document';
=======
>>>>>>> development
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { DashboardChartType, DashboardPage } from '../../app/dashboard/dashboard-types';
import { createSpyObj, FakeLoader } from '../mocks';
import { AASState } from '../../app/aas/aas.state';
<<<<<<< HEAD
=======

import { rotationSpeed, sampleDocument, torque } from '../assets/sample-document';

class MockURL implements Partial<URL> {
    public static createObjectURL(): string {
        return '';
    };

    public static revokeObjectURL(): void {
    }
}
>>>>>>> development

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

<<<<<<< HEAD
@Component({
    selector: 'fhg-img',
    template: '<div></div>',
    styleUrls: [],
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
    let dashboard: jest.Mocked<DashboardService>;
    let router: Router;
    let api: jest.Mocked<EndpointsApi>;
    let download: jest.Mocked<DownloadService>;
=======
describe('AASComponent', () => {
    let fixture: ComponentFixture<AASComponent>;
    let component: AASComponent;
    let dashboard: jest.Mocked<DashboardService>;
    let router: Router;
    let api: jest.Mocked<EndpointsApi>;
>>>>>>> development
    let start: jest.Mocked<StartService>;
    let pages: DashboardPage[];

    beforeEach(async () => {
        pages = [{ name: 'Dashboard 1', items: [], requests: [], active: true }];

<<<<<<< HEAD
        api = createSpyObj<EndpointsApi>(['getDocument', 'putDocument']);
        download = createSpyObj<DownloadService>(['downloadPackage', 'download', 'uploadPackages']);
=======
        api = createSpyObj<EndpointsApi>([
            'getDocument',
            'putDocument',
            'downloadPackage',
            'download',
            'uploadPackage',
        ]);
>>>>>>> development
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
<<<<<<< HEAD
=======

        fixture = TestBed.createComponent(AASComponent);
        component = fixture.componentInstance;
>>>>>>> development
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
<<<<<<< HEAD
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
=======
>>>>>>> development
        expect(component.canPlay()).toBe(false);
    });

    it('indicates that "stop" is disabled while sample AAS is not online ready', () => {
<<<<<<< HEAD
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
=======
>>>>>>> development
        expect(component.canStop()).toBe(false);
    });

    it('indicates that the sample AAS is editable', () => {
<<<<<<< HEAD
        const fixture = TestBed.createComponent(AASComponent);
        const component = fixture.componentInstance;
=======
>>>>>>> development
        expect(component.readOnly()).toBe(false);
    });

    describe('canAddToDashboard', () => {
        it('can add the selected properties to the dashboard', () => {
<<<<<<< HEAD
            const fixture = TestBed.createComponent(AASComponent);
            const component = fixture.componentInstance;
=======
>>>>>>> development
            component.setSelectedElements([torque, rotationSpeed]);
            jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
            expect(component.canAddToDashboard()).toBe(true);
            component.addToDashboard(DashboardChartType.BarVertical);
            expect(dashboard.addChart).toHaveBeenCalled();
            expect(router.navigateByUrl).toHaveBeenCalled();
        });
    });
<<<<<<< HEAD
=======

    describe('download', () => {
        beforeEach(() => {
            Object.defineProperty(globalThis as any, 'URL', {
                configurable: true,
                writable: true,
                value: MockURL,
            });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('does nothing when there is no document content', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const createElSpy = jest.spyOn(dom, 'createElement');
            const state = TestBed.inject(AASState);
            state.update({ document: { ...sampleDocument, content: undefined } });
            component.download();
            expect(createElSpy).not.toHaveBeenCalled();
            createElSpy.mockRestore();
        });

        it('creates a blob, starts download and revokes the object URL after timeout', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const fakeAnchor = { setAttribute: jest.fn(), click: jest.fn(), href: '' };
            const createElSpy = jest.spyOn(dom, 'createElement').mockReturnValue(fakeAnchor as any);
            const createObjectSpy = jest.spyOn(MockURL, 'createObjectURL').mockReturnValue('blob://1');
            const revokeSpy = jest.spyOn(MockURL, 'revokeObjectURL').mockImplementation(() => {});
            const state = TestBed.inject(AASState);
            state.update({ document: sampleDocument });

            jest.useFakeTimers();
            component.download();

            expect(createObjectSpy).toHaveBeenCalled();
            expect(fakeAnchor.setAttribute).toHaveBeenCalledWith('download', `${sampleDocument.idShort}.json`);
            expect(fakeAnchor.click).toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            expect(revokeSpy).toHaveBeenCalledWith('blob://1');

            createElSpy.mockRestore();
            createObjectSpy.mockRestore();
            revokeSpy.mockRestore();
            jest.useRealTimers();
        });

        it('notifies on error when preparing the download fails', () => {
            const state = TestBed.inject(AASState);
            const badDoc = Object.create(sampleDocument);
            Object.defineProperty(badDoc, 'content', {
                get: () => {
                    throw new Error('boom');
                },
                configurable: true,
            });

            state.update({ document: badDoc as any });
            const notify = TestBed.inject(NotifyService) as jest.Mocked<NotifyService>;
            component.download();
            expect(notify.error).toHaveBeenCalled();
        });

        it('downloads a submodel', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const fakeAnchor = { setAttribute: jest.fn(), click: jest.fn(), href: '' };
            const createElSpy = jest.spyOn(dom, 'createElement').mockReturnValue(fakeAnchor as any);
            const createObjectSpy = jest.spyOn(MockURL, 'createObjectURL').mockReturnValue('blob://1');
            const revokeSpy = jest.spyOn(MockURL, 'revokeObjectURL').mockImplementation(() => {});
            const state = TestBed.inject(AASState);
            state.update({ document: sampleDocument });

            jest.useFakeTimers();
            const submodel = sampleDocument.content!.submodels[0];
            component.setSelectedElements([submodel]);
            component.download();

            expect(createObjectSpy).toHaveBeenCalled();
            expect(fakeAnchor.setAttribute).toHaveBeenCalledWith('download', `${submodel.idShort}.json`);
            expect(fakeAnchor.click).toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            expect(revokeSpy).toHaveBeenCalledWith('blob://1');

            createElSpy.mockRestore();
            createObjectSpy.mockRestore();
            revokeSpy.mockRestore();
            jest.useRealTimers();

        });
    });
>>>>>>> development
});
