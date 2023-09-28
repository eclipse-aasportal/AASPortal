/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { first } from 'rxjs';

import { dashboardReducer } from '../../app/dashboard/dashboard.reducer';
import { rotationSpeed, sampleDocument, torque } from '../../test/assets/sample-document';
import { DashboardService } from '../../app/dashboard/dashboard.service';
import { pages } from './test-pages';
import { DashboardChart, DashboardChartType, DashboardItem, DashboardPage } from '../../app/dashboard/dashboard.state';
import { AuthService } from 'projects/aas-lib/src/public-api';

describe('DashboardService', function () {
    let service: DashboardService;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['checkCookie', 'getCookie', 'setCookie']);
        auth.checkCookie.and.returnValue(true);
        auth.getCookie.and.returnValue(JSON.stringify(pages));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: auth
                }
            ],
            imports: [
                HttpClientTestingModule,
                StoreModule.forRoot(
                    {
                        dashboard: dashboardReducer
                    }),
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        service = TestBed.inject(DashboardService);
    });

    it('should be created', function () {
        expect(service).toBeTruthy();
    });

    it('provides always a default page', function () {
        expect(service.defaultPage?.name).toBeDefined();
    });

    it('provides an observable collection of pages', function (done: DoneFn) {
        service.pages.pipe(first()).subscribe(items => {
            expect(items).toEqual(pages);
            done();
        });
    });

    it('allows finding a specific dashboard page', function () {
        expect(service.find('Test')).toEqual(pages[1]);
    });

    it('returns undefined for an unknown dashboard page', function () {
        expect(service.find('unknown')).toBeUndefined();
    });

    it('returns the Test dashboard as a grid with 2 rows and 2/1 column', function () {
        const page = service.find('Test')!;
        const grid = service.getGrid(page);
        expect(grid.length).toEqual(2);
        expect(grid[0].length).toEqual(2);
        expect(grid[1].length).toEqual(1);
    });

    it('returns the Test dashboard as rows', function () {
        const page = service.find('Test')!;
        const rows = service.getRows(page);
        expect(rows.length).toEqual(2);
        expect(rows[0].columns.length).toEqual(2);
        expect(rows[1].columns.length).toEqual(1);
    });

    it('provides the name of the current active dashboard', function (done: DoneFn) {
        service.name.pipe(first()).subscribe(value => {
            expect(value).toEqual('Dashboard 1');
            done();
        });
    });

    describe('setPageName', function () {
        it('allows setting "Test" as new active dashboard', function (done: DoneFn) {
            service.setPageName('Test');
            service.name.pipe(first()).subscribe(value => {
                expect(value).toEqual('Test');
                done();
            });
        });

        it('throws an error if a dashboard with the specified does not exist', function () {
            expect(() => service.setPageName('unknown')).toThrowError();
        });
    });

    describe('add', function () {
        it('allows adding RotationSpeed and Torque to the default page as separate line charts', function (done: DoneFn) {
            service.add(service.defaultPage.name, sampleDocument, [rotationSpeed, torque], DashboardChartType.Line);
            service.pages.pipe(first()).subscribe(items => {
                const defaultPage = items[0];
                expect(defaultPage.items.length).toEqual(2);
                expect(defaultPage.items.map(item => item as DashboardChart)
                    .flatMap(item => item.sources)
                    .map(item => item.label)).toEqual(['RotationSpeed', 'Torque']);

                done();
            });
        });

        it('allows adding RotationSpeed and Torque to the default page as single bar chart', function (done: DoneFn) {
            service.add(service.defaultPage.name, sampleDocument, [rotationSpeed, torque], DashboardChartType.BarVertical);
            service.pages.pipe(first()).subscribe(items => {
                const defaultPage = items[0];
                expect(defaultPage.items.length).toEqual(1);
                const chart = defaultPage.items[0] as DashboardChart;
                expect(chart.sources.map(source => source.label)).toEqual(['RotationSpeed', 'Torque']);
                done();
            });
        });

        it('throws an error when adding a property to an unknown page', function () {
            expect(() => service.add('unknown', sampleDocument, [rotationSpeed, torque], DashboardChartType.BarVertical)).toThrowError();
        });
    });

    describe('save', function () {
        it('allows saving the current dashboard state', function () {
            service.add(service.defaultPage.name, sampleDocument, [rotationSpeed, torque], DashboardChartType.BarVertical);
            service.save();
            expect(auth.setCookie).toHaveBeenCalled();
        });
    });

    describe('canMove...', function () {
        let page: DashboardPage;
        let grid: DashboardItem[][];

        beforeEach(function () {
            page = service.find('Test')!;
            grid = service.getGrid(page);
        });

        it('indicates whether a chart can be moved to the left', function () {
            expect(service.canMoveLeft(page, grid[0][0])).toBeFalse();
            expect(service.canMoveLeft(page, grid[0][1])).toBeTrue();
            expect(service.canMoveLeft(page, grid[1][0])).toBeFalse();
        });

        it('indicates whether a chart can be moved to the right', function () {
            expect(service.canMoveRight(page, grid[0][0])).toBeTrue();
            expect(service.canMoveRight(page, grid[0][1])).toBeFalse();
            expect(service.canMoveRight(page, grid[1][0])).toBeFalse();
        });

        it('indicates whether a chart can be moved up', function () {
            expect(service.canMoveUp(page, grid[0][0])).toBeTrue();
            expect(service.canMoveUp(page, grid[0][1])).toBeTrue();
            expect(service.canMoveUp(page, grid[1][0])).toBeTrue();
        });

        it('indicates whether a chart can be moved down', function () {
            expect(service.canMoveDown(page, grid[0][0])).toBeTrue();
            expect(service.canMoveDown(page, grid[0][1])).toBeTrue();
            expect(service.canMoveDown(page, grid[1][0])).toBeFalse();
        });
    });
});