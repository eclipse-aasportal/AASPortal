/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointType } from 'common';

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
            return url.searchParams.get('type') as AASEndpointType ?? 'AasxServer';
        case 'opc.tcp:':
            return 'OpcuaServer';
        default:
            throw new Error(`Protocol "${url.protocol}" is not supported.`);
    }
}

/**
 * Creates an AAS container endpoint URL with required search parameters.
 * @param address The URL.
 * @param options The container endpoint options or names.
 * @returns The endpoint URL.
 */
export function createEndpointURL(
    address: string | URL,
    options?: string | { name?: string, type?: AASEndpointType, params?: [string, string][] }): URL {
    const endpoint = typeof address === 'string' ? new URL(address) : address;
    let name: string | undefined;
    let type: AASEndpointType | undefined;
    const params: [string, string][] = [];
    endpoint.searchParams.forEach((value, key) => params.push([key, value]));
    params.forEach(param => endpoint.searchParams.delete(param[0]));
    if (typeof options === 'string') {
        name = options;
    } else if (options) {
        name = options.name;
        type = options.type;
        if (options.params) {
            params.push(...options.params);
        }
    }

    if (!name) {
        const tuple = params.find(item => item[0] === 'name');
        if (tuple) {
            name = tuple[1];
        }
    }

    if (!type) {
        const tuple = params.find(item => item[0] === 'type');
        if (tuple) {
            type = tuple[1] as AASEndpointType;
        }
    }

    if (type !== 'AASRegistry' || (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:')) {
        type = undefined;
    }

    if (name) {
        endpoint.searchParams.append('name', name);
    }

    if (type) {
        endpoint.searchParams.append('type', type);
    }

    params?.forEach(item => {
        if (item[0] !== 'type' && item[1] !== 'name') {
            endpoint.searchParams.append(item[0], item[1]);
        }
    });

    return endpoint;
}

/**
 * Creates an AAS container endpoint URL with required search parameters.
 * @param address The AAS container endpoint address (URL).
 * @param options The container endpoint options or name.
 * @returns The endpoint URL as string.
 */
export function createEndpoint(
    address: string | URL,
    options?: string | { name?: string, type?: AASEndpointType, params?: [string, string][] }): string {
    return createEndpointURL(address, options).href;
}
