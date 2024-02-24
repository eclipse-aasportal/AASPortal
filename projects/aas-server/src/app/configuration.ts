/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpoint, getEndpointName, getEndpointType } from 'common';

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

    value.search = '';
    value.hash = '';

    return { url: value.href.split('?')[0], name: name, type, version };
}
