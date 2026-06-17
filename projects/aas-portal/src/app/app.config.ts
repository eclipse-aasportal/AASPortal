/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, ErrorHandler, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
    API_URL,
    AuthInterceptor,
    CacheInterceptor,
    CustomerFeedbackCardComponent,
    FavoriteComponent,
    NotifyService,
    START_TILE_TYPES,
    START_TILES,
    StartTileType,
    VIEW_ROUTES,
    viewRoutes,
    WINDOW,
    WindowService,
} from 'aas-lib';

import { routes } from './app.routes';
import { ChartComponent } from './dashboard/chart/chart.component';
import { AboutCardComponent } from './about/about-card.component';
import { ApiUrlService } from './api-url.service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            fallbackLang: 'en-us',
            loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
        }),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
        {
            provide: START_TILE_TYPES,
            useValue: [
                {
                    name: 'Favorite',
                    component: FavoriteComponent,
                },
                {
                    name: 'About',
                    component: AboutCardComponent,
                },
                {
                    name: 'CustomerFeedback',
                    component: CustomerFeedbackCardComponent,
                },
                {
                    name: 'Chart',
                    component: ChartComponent,
                },
            ] satisfies StartTileType[],
        },
        {
            provide: START_TILES,
            useValue: [],
        },
        {
            provide: VIEW_ROUTES,
            useValue: viewRoutes,
        },
        {
            provide: API_URL,
            useFactory: (window: WindowService) => new ApiUrlService(window),
            deps: [WINDOW],
        },
        {
            provide: ErrorHandler,
            useFactory: (notify: NotifyService) => notify,
            deps: [NotifyService],
        },
        provideZonelessChangeDetection(),
    ],
};
