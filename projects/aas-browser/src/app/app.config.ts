/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { API_URL, CacheInterceptor, WINDOW, WindowService } from 'aas-lib';
import { routes } from './app.routes';
import { ApiUrlService } from './api-url.service';
import { AuthInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        {
            provide: API_URL,
            useFactory: (window: WindowService) => new ApiUrlService(window),
            deps: [WINDOW],
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CacheInterceptor,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true,
        },
        provideTranslateService({
            fallbackLang: 'en-us',
            loader: provideTranslateHttpLoader({ prefix: 'assets/i18n/', suffix: '.json' }),
        }),
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
    ],
};
