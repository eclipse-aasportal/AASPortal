/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import {
    AuthInterceptor,
    CustomerFeedbackCardComponent,
    DigitalNameplateCardComponent,
    DigitalProductPassportCardComponent,
    FavoriteComponent,
    START_TILE_TYPES,
    START_TILES,
    StartTile,
    StartTileType,
} from 'aas-lib';

import { HttpLoaderFactory } from './http-loader-factory';
import { routes } from './app.routes';
import { DashboardCardComponent } from './dashboard/dashboard-card.component';
import { AboutCardComponent } from './about/about-card.component';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        importProvidersFrom(
            TranslateModule.forRoot({
                defaultLanguage: 'en-us',
                loader: {
                    provide: TranslateLoader,
                    useFactory: HttpLoaderFactory,
                    deps: [HttpClient],
                },
            }),
        ),
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
                    name: 'DigitalNameplate',
                    component: DigitalNameplateCardComponent,
                },
                {
                    name: 'DigitalProductPassport',
                    component: DigitalProductPassportCardComponent,
                },
                {
                    name: 'CustomerFeedback',
                    component: CustomerFeedbackCardComponent,
                },
                {
                    name: 'Dashboard',
                    component: DashboardCardComponent,
                },
            ] satisfies StartTileType[],
        },
        {
            provide: START_TILES,
            useValue: [
                {
                    type: 'About',
                    id: '395d511d-93ef-443a-b961-0ebdf7d2c55b',
                    property: {},
                } satisfies StartTile,
            ],
        },
    ],
};
