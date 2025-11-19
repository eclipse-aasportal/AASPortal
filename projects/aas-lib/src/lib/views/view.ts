/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AASDocument } from 'aas-core';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRoute, ViewRouteName } from '../types';
import { VIEW_ROUTE_NAME } from './view-route-name';
import { VIEW_ROUTES } from './views-routes';
import { encodeBase64Url } from '../utilities';

/** Provides a specific view. */
export abstract class View {
    /**
     * Creates a new instance of a derived `View` class.
     * @param route The activated route.
     * @param api The endpoint API.
     */
    protected constructor(
        protected readonly route: ActivatedRoute,
        protected readonly api: EndpointsApi,
        protected readonly viewRoutes: ViewRoute[],
        protected readonly viewRouteName: ViewRouteName,
    ) {
        this.view = this.viewRoutes.find(item => item.path === viewRouteName)!;
    }

    protected view: ViewRoute;

    /** The index of the current active document-submodel tuple. */
    public readonly index = signal(1);

    /** The number of document-submodel tuples. */
    public abstract readonly count: Signal<number>;

    /** The current active AAS document. */
    public abstract readonly document: Signal<AASDocument | undefined>;

    /** The version of the current active submodel. */
    public abstract readonly version: Signal<string | undefined>;

    public openAASOverview() {
        const document = this.document();
        if (document === undefined) {
            return '';
        }

        const endpoint = document.endpoint;
        const id = document.id;
        return [`/aas/`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}

/** Provides a specific view. */
@Component({ selector: 'awp-view', template: '' })
export abstract class View2 {
    protected readonly route = inject(ActivatedRoute);
    protected readonly api = inject(EndpointsApi);
    protected readonly viewRoutes = inject(VIEW_ROUTES);
    protected readonly viewRouteName = inject(VIEW_ROUTE_NAME);

    protected constructor() {
        this.view = this.viewRoutes.find(item => item.path === this.viewRouteName)!;
    }

    protected view: ViewRoute;

    /** The index of the current active document-submodel tuple. */
    public readonly index = signal(1);

    /** The number of document-submodel tuples. */
    public abstract readonly count: Signal<number>;

    /** The current active AAS document. */
    public abstract readonly document: Signal<AASDocument | undefined>;

    /** The version of the current active submodel. */
    public abstract readonly version: Signal<string | undefined>;

    public openAASOverview() {
        const document = this.document();
        if (document === undefined) {
            return '';
        }

        const endpoint = document.endpoint;
        const id = document.id;
        return [`/aas/`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}
