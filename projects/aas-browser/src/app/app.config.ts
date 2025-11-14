/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { API_URL, WINDOW, WindowService } from 'aas-lib';
import { ApiUrlService } from './api-url.service';

export const appConfig: ApplicationConfig = {
    providers: [
        {
            provide: API_URL,
            useFactory: (window: WindowService) => new ApiUrlService(window),
            deps: [WINDOW],
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
