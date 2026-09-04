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
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Component, input, output, provideZonelessChangeDetection, signal } from '@angular/core';

import { AASDocument, aas, noop } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    EndpointsApi,
    NotifyService,
    LiveState,
    StartService,
    ToolbarService,
    VIEW_ROUTES,
    DashboardService,
    DashboardPage,
} from 'aas-lib';

import { AASComponent } from './aas.component';
import { createSpyObj, FakeLoader } from '../../test/mocks';
import { AASState } from './aas.state';

import { rotationSpeed, sampleDocument, torque } from '../../test/assets/sample-document';

@Component({
    selector: 'fhg-aas-tree',
    template: '<div></div>',
    styleUrls: [],
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
    let fixture: ComponentFixture<AASComponent>;
    let component: AASComponent;
    let dashboard: Mocked<DashboardService>;
    let api: Mocked<EndpointsApi>;
    let start: Mocked<StartService>;
    let pages: DashboardPage[];

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
                    useValue: createSpyObj<AuthService>(['checkAuthorized']),
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

        const state = TestBed.inject(AASState);
        state.update({ document: sampleDocument });

        fixture = TestBed.createComponent(AASComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
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
});
