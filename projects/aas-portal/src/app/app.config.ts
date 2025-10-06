/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import {
    AuthInterceptor,
    CustomerFeedbackCardComponent,
    FavoriteComponent,
    START_TILE_TYPES,
    START_TILES,
    StartTileType,
    VIEW_ROUTES,
    viewRoutes,
} from 'aas-lib';

import { routes } from './app.routes';
import { ChartComponent } from './dashboard/chart/chart.component';
import { AboutCardComponent } from './about/about-card.component';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService({
            fallbackLang: 'en-us',
            loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
        }),
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
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
        provideZonelessChangeDetection(),
    ],
};
