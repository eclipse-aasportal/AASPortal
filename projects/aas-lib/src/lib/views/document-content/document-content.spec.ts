/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    DOCUMENT,
    input,
    output,
    provideZonelessChangeDetection,
    signal,
} from '@angular/core';

import { AASDocument, aas, noop } from 'aas-core';
import { LiveState } from '../../types';
import { DocumentContentState } from './document-content.state';
import { createSpyObj, FakeLoader } from '../../../test/mocks';
import { EndpointsApi } from '../../services/endpoints-api';
import { DashboardService } from '../../features/dashboard/dashboard.service';
import { StartService } from '../../services/start.service';
import { NotifyService } from '../../core/notify/notify.service';
import { ToolbarService } from '../../services/toolbar.service';
import { AuthService } from '../../core/auth/auth.service';
import { VIEW_ROUTES } from '../views-routes';
import { DocumentContent } from './document-content';
import { AASTreeComponent } from '../../components/aas-tree/aas-tree.component';
import { DashboardChartType, DashboardPage } from '../../features/dashboard/dashboard-types';

import { rotationSpeed, sampleDocument, torque } from '../../../test/assets/sample-document';

const URLMock = vi.fn(
    class {
        public static createObjectURL(): string {
            return '';
        }

        public static revokeObjectURL(): void {}
    },
);

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

describe('DocumentContent', () => {
    let fixture: ComponentFixture<DocumentContent>;
    let component: DocumentContent;
    let dashboard: Mocked<DashboardService>;
    let router: Router;
    let api: Mocked<EndpointsApi>;
    let start: Mocked<StartService>;
    let pages: DashboardPage[];
    let state: DocumentContentState;

    beforeEach(async () => {
        pages = [{ name: 'Dashboard 1', items: [], requests: [], active: true }];

        api = createSpyObj<EndpointsApi>([
            'getDocument',
            'putDocument',
            'downloadPackage',
            'download',
            'uploadPackage',
        ]);

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
                {
                    provide: VIEW_ROUTES,
                    useValue: [],
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
            imports: [DocumentContent],
        }).compileComponents();

        TestBed.overrideComponent(DocumentContent, {
            remove: {
                imports: [AASTreeComponent],
            },
            add: {
                imports: [TestAASTreeComponent],
            },
        });

        router = TestBed.inject(Router);
        state = TestBed.inject(DocumentContentState);
        state.update({ document: sampleDocument });

        fixture = TestBed.createComponent(DocumentContent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the document version', () => {
        expect(component.version()).toBeUndefined();
    });

    it('indicates that "play" is disabled while sample AAS is not online ready', () => {
        expect(component.canPlay()).toBe(false);
    });

    it('indicates that "stop" is disabled while sample AAS is not online ready', () => {
        expect(component.canStop()).toBe(false);
    });

    describe('canAddToDashboard', () => {
        it('can add the selected properties to the dashboard', () => {
            component.setSelectedElements([torque, rotationSpeed]);
            vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
            expect(component.canAddToDashboard()).toBe(true);
            component.addToDashboard(DashboardChartType.BarVertical);
            expect(dashboard.addChart).toHaveBeenCalled();
            expect(router.navigateByUrl).toHaveBeenCalled();
        });
    });

    describe('download', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.stubGlobal('URL', URLMock);
        });

        afterEach(() => {
            vi.useRealTimers();
            vi.clearAllMocks();
            vi.unstubAllGlobals();
        });

        it('does nothing when there is no document content', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const createElSpy = vi.spyOn(dom, 'createElement');
            const state = TestBed.inject(DocumentContentState);
            state.update({ document: { ...sampleDocument, content: undefined } });
            component.download();
            expect(createElSpy).not.toHaveBeenCalled();
            createElSpy.mockRestore();
        });

        it('creates a blob, starts download and revokes the object URL after timeout', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const fakeAnchor = { setAttribute: vi.fn(), click: vi.fn(), href: '' };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const createElSpy = vi.spyOn(dom, 'createElement').mockReturnValue(fakeAnchor as any);
            const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://1');
            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            component.download();

            expect(createObjectSpy).toHaveBeenCalled();
            expect(fakeAnchor.setAttribute).toHaveBeenCalledWith('download', `${sampleDocument.idShort}.json`);
            expect(fakeAnchor.click).toHaveBeenCalled();

            vi.advanceTimersByTime(1000);
            expect(revokeSpy).toHaveBeenCalledWith('blob://1');

            createElSpy.mockRestore();
            createObjectSpy.mockRestore();
            revokeSpy.mockRestore();
        });

        it('notifies on error when preparing the download fails', () => {
            const state = TestBed.inject(DocumentContentState);
            const badDoc = Object.create(sampleDocument);
            Object.defineProperty(badDoc, 'content', {
                get: () => {
                    throw new Error('boom');
                },
                configurable: true,
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state.update({ document: badDoc as any });
            const notify = TestBed.inject(NotifyService) as Mocked<NotifyService>;
            component.download();
            expect(notify.error).toHaveBeenCalled();
        });

        it('downloads a submodel', () => {
            const dom = TestBed.inject(DOCUMENT) as Document;
            const fakeAnchor = { setAttribute: vi.fn(), click: vi.fn(), href: '' };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const createElSpy = vi.spyOn(dom, 'createElement').mockReturnValue(fakeAnchor as any);
            const createObjectSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://1');
            const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

            const submodel = sampleDocument.content!.submodels[0];
            component.setSelectedElements([submodel]);
            component.download();

            expect(createObjectSpy).toHaveBeenCalled();
            expect(fakeAnchor.setAttribute).toHaveBeenCalledWith('download', `${submodel.idShort}.json`);
            expect(fakeAnchor.click).toHaveBeenCalled();

            vi.advanceTimersByTime(1000);
            expect(revokeSpy).toHaveBeenCalledWith('blob://1');

            createElSpy.mockRestore();
            createObjectSpy.mockRestore();
            revokeSpy.mockRestore();
        });
    });
});
