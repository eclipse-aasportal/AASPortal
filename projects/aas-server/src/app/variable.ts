/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import { singleton } from 'tsyringe';
import { fileURLToPath } from 'url';

@singleton()
export class Variable {
    /** The port of the AASServer. */
    public readonly AAS_SERVER_PORT = Number(process.env.AAS_SERVER_PORT ?? '50010');

    /** The user name of AASServer (default: aas-server) */
    public readonly AAS_SERVER_USERNAME = process.env.AAS_SERVER_USERNAME ?? 'aas-server';

    /** The root password. */
    public readonly AAS_SERVER_PASSWORD = process.env.AAS_SERVER_PASSWORD ?? 'aas-server';

    /** The assets directory. */
    public readonly ASSETS = path.resolve(process.env.ASSETS ?? './assets');

    /** The cache size. */
    public readonly CACHE_SIZE = Number(process.env.CACHE_SIZE ?? '100');

    /** */
    public readonly CORS_ORIGIN: string | string[] = process.env.CORS_ORIGIN
        ? JSON.parse(process.env.CORS_ORIGIN)
        : '*';

    /** The URL of the database. */
    public readonly DATA = fileURLToPath(new URL(process.env.DATA ?? './data', import.meta.url));

    /** Enables serving static files by AAS Server. If the value is `true`, the AASBrowser web application is activated. */
    public readonly ENABLE_STATIC_FILES = Boolean(process.env.ENABLE_STATIC_FILES);

    /** The key file if AASServer supports HTTPS. */
    public readonly HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE;

    /** The certificate file if AASServer supports HTTPS. */
    public readonly HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE;

    /** The pfx file if AASServer supports HTTPS. */
    public readonly HTTPS_PFX_FILE = process.env.HTTPS_PFX_FILE;

    /** The maximum number of elements in a page result. */
    public readonly LIMIT = Number(process.env.LIMIT ?? '100');

    /** The number of items in a page. */
    public readonly PAGE_SIZE = Number(process.env.PAGE_SIZE ?? 100);

    /** The root directory for static files. */
    public readonly WEB_ROOT = fileURLToPath(new URL(process.env.WEB_ROOT ?? './wwwroot', import.meta.url));

    /** The logging level. */
    public readonly LOG_LEVEL: 'Error' | 'Warning' | 'Info' =
        (process.env.LOG_LEVEL as 'Error' | 'Warning' | 'Info') ?? 'Info';

    /** Enables authentication. */
    public readonly API_KEY_HANDLER?: string = process.env.API_KEY_HANDLER;
}
