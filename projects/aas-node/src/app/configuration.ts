/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpoint, getEndpointName, getEndpointType } from 'aas-core';
import { decodeBase64Url } from './convert.js';

/** The AAS Server configuration. */
export interface AASServerConfiguration {
    endpoints: AASEndpoint[];
}

/**
 * Creates an AASEndpoint form an URL.
 * @param url The current URL.
 * @returns An equivalent AASEndpoint.
 */
export function urlToEndpoint(url: string | URL): AASEndpoint {
    const value = typeof url === 'string' ? new URL(url) : url;
    const name = getEndpointName(value);
    const type = getEndpointType(value);
    const version = value.searchParams.get('version') ?? 'v3';
    const schedule = value.searchParams.get('schedule');
    const headers = value.searchParams.get('headers');

    value.search = '';
    value.hash = '';

    const endpoint: AASEndpoint = { url: value.href.split('?')[0], name: name, type, version };
    if (schedule) {
        endpoint.schedule = JSON.parse(decodeBase64Url(schedule));
    }

    if (headers) {
        endpoint.headers = JSON.parse(decodeBase64Url(headers));
    }

    return endpoint;
}
