/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Signal, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AASDocument } from 'aas-core';
import { encodeBase64Url } from '../utilities';
import { EndpointsApi } from '../services/endpoints-api';
import { ViewRouteName } from '../types';

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
        protected readonly expectedRoute: ViewRouteName,
    ) {}

    /** The index of the current active document-submodel tuple. */
    public readonly index = signal(1);

    /** The number of document-submodel tuples. */
    public abstract readonly count: Signal<number>;

    /** The current active AAS document. */
    public abstract readonly document: Signal<AASDocument | undefined>;

    /** The thumbnail URL of the current active AAS document. */
    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (!document) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    /** The version of the current active submodel. */
    public abstract readonly version: Signal<string | undefined>;

    /** ToDo: */
    protected abstract onInit(): void;
}
