/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, Signal, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AASDocument } from 'aas-core';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRoute } from '../types';
import { VIEW_ROUTE_NAME } from './view-route-name';
import { VIEW_ROUTES } from './views-routes';
import { encodeBase64Url } from '../utilities';
import { TranslateService } from '@ngx-translate/core';

/**
 * Provides a specific view component.
 */
@Component({ selector: 'awp-view', template: '' })
export abstract class View {
    protected readonly route = inject(ActivatedRoute);
    protected readonly api = inject(EndpointsApi);
    protected readonly translate = inject(TranslateService);
    protected readonly viewRoutes = inject(VIEW_ROUTES);
    protected readonly viewRouteName = inject(VIEW_ROUTE_NAME);

    protected constructor() {
        this.view = this.viewRoutes.find(item => item.path === this.viewRouteName)!;
    }

    protected readonly currentLang = computed(() => this.translate.currentLang() ?? 'en-us');

    protected view: ViewRoute;

    /** The index of the current active document-submodel tuple. */
    public readonly index = signal(1);

    /** The number of document-submodel tuples. */
    public abstract readonly count: Signal<number>;

    /** The current active AAS document. */
    public abstract readonly document: Signal<AASDocument | undefined>;

    /** The version of the current active submodel. */
    public abstract readonly version: Signal<string | undefined>;

    public openAASOverview(): string | unknown[] {
        const document = this.document();
        if (document === undefined) {
            return '';
        }

        const endpoint = document.endpoint;
        const id = document.id;
        return [`/aas/`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}
