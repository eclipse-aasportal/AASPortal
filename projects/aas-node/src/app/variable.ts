/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';
import path from 'path/posix';

@singleton()
export class Variable {
    /** The validity period of an AAS in milliseconds. */
    public readonly AAS_EXPIRES_IN: number = process.env.AAS_EXPIRES_IN ? Number(process.env.AAS_EXPIRES_IN) : 86400000;

    /** The AASIndex realization. */
    public readonly AAS_INDEX?: string = process.env.AAS_INDEX;

    /** The root password. */
    public readonly AAS_NODE_PASSWORD: string = process.env.AAS_NODE_PASSWORD ?? 'aas-node';

    /** The port of the AASNode. */
    public readonly AAS_NODE_PORT: number = Number(process.env.AAS_NODE_PORT ?? '1337');

    /** The user name of AASNode (default: aas-node) */
    public readonly AAS_NODE_USERNAME: string = process.env.AAS_NODE_USERNAME ?? 'aas-node';

    /** The assets directory. */
    public readonly ASSETS: string = path.resolve(process.env.ASSETS ?? './assets');

    /** The directory where the AASNode app is located. */
    public readonly CONTENT_ROOT: string = path.resolve(process.env.CONTENT_ROOT ?? './');

    /** The URL of the cookie storage. */
    public readonly COOKIE_STORE?: string = process.env.COOKIE_STORE;

    /** The CORS origin settings. */
    public readonly CORS_ORIGIN: string | string[] = process.env.CORS_ORIGIN
        ? JSON.parse(process.env.CORS_ORIGIN)
        : ['http://localhost:4200', 'http://localhost:1337'];

    /** The URLs of the initial AAS container endpoints. */
    public readonly ENDPOINTS: string[] = process.env.ENDPOINTS
        ? JSON.parse(process.env.ENDPOINTS)
        : ['file:///endpoints/samples?name=Samples'];

    /** The certificate file if AASNode supports HTTPS. */
    public readonly HTTPS_CERT_FILE?: string = process.env.HTTPS_CERT_FILE;

    /** The key file if AASNode supports HTTPS. */
    public readonly HTTPS_KEY_FILE?: string = process.env.HTTPS_KEY_FILE;

    /** The pfx file if AASNode supports HTTPS. */
    public readonly HTTPS_PFX_FILE?: string = process.env.HTTPS_PFX_FILE;

    /** The URL of the host */
    public readonly HOST_URL?: string = process.env.HOST_URL;

    /** Specifies the identity provider issuer URL */
    public readonly IDENTITY_PROVIDER: string = process.env.IDENTITY_PROVIDER ?? 'file:///users';

    /** The client name or identifier. */
    public readonly CLIENT_ID: string = process.env.CLIENT_ID ?? 'aas-node';

    /** The client secret. */
    public readonly CLIENT_SECRET: string = process.env.CLIENT_SECRET ?? 'aas-node-client-secret-for-development';

    /** The redirect URI after successful login. */
    public readonly REDIRECT_URI?: string = process.env.REDIRECT_URI;

    /** The logging level. */
    public readonly LOG_LEVEL: 'Error' | 'Warning' | 'Info' =
        (process.env.LOG_LEVEL as 'Error' | 'Warning' | 'Info') ?? 'Info';

    /** The number of worker threads. */
    public readonly MAX_WORKERS: number = process.env.MAX_WORKERS ? Number(process.env.MAX_WORKERS) : 2;

    /** The time before a new endpoint scan starts.*/
    public readonly SCAN_ENDPOINT_TIMEOUT: number = process.env.SCAN_ENDPOINT_TIMEOUT
        ? Number(process.env.SCAN_ENDPOINT_TIMEOUT)
        : 3600000;

    /** The session secret. */
    public readonly SESSION_SECRET: string = process.env.SESSION_SECRET ?? 'aas-portal-session-secret';

    /** The session store. */
    public readonly SESSION_STORE?: string = process.env.SESSION_STORE;

    /** The root directory for static files. */
    public readonly WEB_ROOT: string = path.resolve(process.env.WEB_ROOT ?? './wwwroot');
}
