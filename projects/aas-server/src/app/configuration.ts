/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpoint, AASEndpointType } from 'common';

/** The AAS Server configuration. */
export interface AASServerConfiguration {
    endpoints: AASEndpoint[];
}

/**
 * Gets the endpoint name from the specified URL.
 * @param url The endpoint URL.
 * @returns The name.
 */
export function getEndpointName(url: string | URL): string {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    return url.searchParams.get('name') ?? url.href.split('?')[0];
}

/**
 * Gets the endpoint type from the specified URL.
 * @param url The URL.
 * @returns The endpoint type.
 */
export function getEndpointType(url: string | URL): AASEndpointType {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    switch (url.protocol) {
        case 'file:':
            return 'AasxDirectory';
        case 'http:':
        case 'https:':
            return (url.searchParams.get('type') as AASEndpointType) ?? 'AasxServer';
        case 'opc.tcp:':
            return 'OpcuaServer';
        default:
            throw new Error(`Protocol "${url.protocol}" is not supported.`);
    }
}

/**
 * Creates an AAS container endpoint URL with required search parameters.
 * @param address The AAS container endpoint address (URL).
 * @param options The container endpoint options or name.
 * @returns The endpoint URL as string.
 */
export function createEndpoint(
    url: string,
    name: string,
    type: AASEndpointType = 'AasxServer',
    version: string = '3.0',
): AASEndpoint {
    return { url, name, type, version };
}

/**
 * Creates an AASEndpoint form an URL.
 * @param url The current URL.
 * @returns An equivalent AASEndpoint.
 */
export function urlToEndpoint(url: string): AASEndpoint {
    const value = new URL(url);
    const name = value.searchParams.get('name');
    const type = (value.searchParams.get('type') as AASEndpointType) ?? getEndpointType(value);
    const version = value.searchParams.get('version') ?? '3.0';

    value.search = '';
    value.hash = '';

    return { url: value.href, name: name ?? value.href, type, version };
}

/**
 * Creates an URL that represents an AASEndpoint.
 */
export function endpointUrl(url: string, name: string, type: AASEndpointType, version?: string): URL {
    const value = new URL(url);
    value.searchParams.append('name', name);
    value.searchParams.append('type', type);
    if (version) {
        value.searchParams.append('version', version);
    }

    return value;
}