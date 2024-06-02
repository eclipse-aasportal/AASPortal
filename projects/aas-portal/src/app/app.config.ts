/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AuthInterceptor } from 'aas-lib';

import { HttpLoaderFactory } from './http-loader-factory';
import { routes } from './app.routes';
import { CanActivateAAS } from './aas/can-activate-aas.guard';

export const appConfig: ApplicationConfig = {
    providers: [
        CanActivateAAS,
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
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    ],
};
