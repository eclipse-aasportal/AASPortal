/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import { AuthService } from 'aas-lib';

import { rotationSpeed, sampleDocument, torque } from '../../test/assets/sample-document';
import { pages } from './test-pages';
import {
    DashboardChart,
    DashboardChartType,
    DashboardItem,
    DashboardPage,
    DashboardService,
} from '../../app/dashboard/dashboard.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardService', () => {
    let service: DashboardService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['checkCookie', 'getCookie', 'setCookie'], { ready: of(true) });
        auth.checkCookie.and.returnValue(of(true));
        auth.setCookie.and.returnValue(of(void 0));
        auth.getCookie.and.returnValue(EMPTY);

        TestBed.configureTestingModule({
    imports: [TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useClass: TranslateFakeLoader,
            },
        })],
    providers: [
        {
            provide: AuthService,
            useValue: auth,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});

        service = TestBed.inject(DashboardService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('provides always an active page', () => {
        expect(service.activePage()).toBeDefined();
    });

    describe('with pages', () => {
        beforeEach(() => {
            service.state = { pages, index: 0 };
        });

        it('provides an observable collection of pages', () => {
            expect(service.pages()).toEqual(pages);
        });

        it('allows finding a specific dashboard page', () => {
            expect(service.getPage('Test')).toEqual(pages[1]);
        });

        it('returns undefined for an unknown dashboard page', () => {
            expect(service.getPage('unknown')).toBeUndefined();
        });

        it('returns the Test dashboard as a grid with 2 rows and 2/1 column', () => {
            const page = service.getPage('Test')!;
            const grid = service.getGrid(page);
            expect(grid.length).toEqual(2);
            expect(grid[0].length).toEqual(2);
            expect(grid[1].length).toEqual(1);
        });

        it('provides the name of the current active dashboard', () => {
            expect(service.activePage().name).toEqual('Dashboard 1');
        });

        describe('setPageName', () => {
            it('allows setting "Test" as new active dashboard', () => {
                service.setPage('Test');
                expect(service.activePage().name).toEqual('Test');
            });

            it('throws an error if a dashboard with the specified does not exist', () => {
                expect(() => service.setPage('unknown')).toThrowError();
            });
        });

        describe('add', () => {
            it('allows adding RotationSpeed and Torque to the default page as separate line charts', () => {
                let activePage = service.state.pages[service.state.index];
                service.add(activePage, sampleDocument, [rotationSpeed, torque], DashboardChartType.Line);
                activePage = service.state.pages[service.state.index];
                expect(activePage.items.length).toEqual(2);
                expect(
                    activePage.items
                        .map(item => item as DashboardChart)
                        .flatMap(item => item.sources)
                        .map(item => item.label),
                ).toEqual(['RotationSpeed', 'Torque']);
            });

            it('allows adding RotationSpeed and Torque to the default page as single bar chart', () => {
                let activePage = service.state.pages[service.state.index];
                service.add(activePage, sampleDocument, [rotationSpeed, torque], DashboardChartType.BarVertical);
                activePage = service.state.pages[service.state.index];
                expect(activePage.items.length).toEqual(1);
                const chart = activePage.items[0] as DashboardChart;
                expect(chart.sources.map(source => source.label)).toEqual(['RotationSpeed', 'Torque']);
            });

            it('throws an error when adding a property to an unknown page', () => {
                expect(() =>
                    service.add(
                        jasmine.createSpyObj<DashboardPage>([], { name: 'unknown' }),
                        sampleDocument,
                        [rotationSpeed, torque],
                        DashboardChartType.BarVertical,
                    ),
                ).toThrowError();
            });
        });

        describe('save', () => {
            it('allows saving the current dashboard state', (done: DoneFn) => {
                const activePage = service.state.pages[service.state.index];
                service.add(activePage, sampleDocument, [rotationSpeed, torque], DashboardChartType.BarVertical);

                service.save().subscribe(() => {
                    expect(auth.setCookie).toHaveBeenCalled();
                    done();
                });
            });
        });

        describe('canMove...', () => {
            let page: DashboardPage;
            let grid: DashboardItem[][];

            beforeEach(() => {
                page = service.getPage('Test')!;
                grid = service.getGrid(page);
            });

            it('indicates whether a chart can be moved to the left', () => {
                expect(service.canMoveLeft(page, grid[0][0])).toBeFalse();
                expect(service.canMoveLeft(page, grid[0][1])).toBeTrue();
                expect(service.canMoveLeft(page, grid[1][0])).toBeFalse();
            });

            it('indicates whether a chart can be moved to the right', () => {
                expect(service.canMoveRight(page, grid[0][0])).toBeTrue();
                expect(service.canMoveRight(page, grid[0][1])).toBeFalse();
                expect(service.canMoveRight(page, grid[1][0])).toBeFalse();
            });

            it('indicates whether a chart can be moved up', () => {
                expect(service.canMoveUp(page, grid[0][0])).toBeTrue();
                expect(service.canMoveUp(page, grid[0][1])).toBeTrue();
                expect(service.canMoveUp(page, grid[1][0])).toBeTrue();
            });

            it('indicates whether a chart can be moved down', () => {
                expect(service.canMoveDown(page, grid[0][0])).toBeTrue();
                expect(service.canMoveDown(page, grid[0][1])).toBeTrue();
                expect(service.canMoveDown(page, grid[1][0])).toBeFalse();
            });
        });
    });
});
