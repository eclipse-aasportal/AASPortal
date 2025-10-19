/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import { singleton } from 'tsyringe';

@singleton()
export class Variable {
    public constructor() {
        this.AAS_SERVER_PASSWORD = process.env.AAS_SERVER_PASSWORD ?? 'aas-server';
        this.AAS_SERVER_PORT = Number(process.env.AAS_SERVER_PORT ?? '50010');
        this.AAS_SERVER_USERNAME = process.env.AAS_SERVER_USERNAME ?? 'aas-server';
        this.ASSETS = path.resolve(process.env.ASSETS ?? './assets');
        this.CACHE_SIZE = Number(process.env.CACHE_SIZE ?? '100');
        this.CORS_ORIGIN = process.env.CORS_ORIGIN ? JSON.parse(process.env.CORS_ORIGIN) : '*';
        this.DATA = path.resolve(process.env.DATA ?? './data');
        this.ENABLE_STATIC_FILES = Boolean(process.env.ENABLE_STATIC_FILES);
        this.HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE;
        this.HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE;
        this.HTTPS_PFX_FILE = process.env.HTTPS_PFX_FILE;
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRED_IN ? Number(process.env.JWT_EXPIRED_IN) : 604800;
        this.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
        this.JWT_SECRET = process.env.JWT_SECRET ?? 'The quick brown fox jumps over the lazy dog.';
        this.LIMIT = Number(process.env.LIMIT ?? '100');
        this.LOG_LEVEL = (process.env.LOG_LEVEL as 'Error' | 'Warning' | 'Info') ?? 'Info';
        this.PAGE_SIZE = Number(process.env.CLUSTER_SIZE ?? 100);
        this.WEB_ROOT = path.resolve(process.env.WEB_ROOT ?? './wwwroot');
    }

    /** The port of the AASServer. */
    public readonly AAS_SERVER_PORT: number;

    /** The user name of AASServer (default: aas-server) */
    public readonly AAS_SERVER_USERNAME: string;

    /** The root password. */
    public readonly AAS_SERVER_PASSWORD: string;

    /** The assets directory. */
    public readonly ASSETS: string;

    /** The cache size. */
    public readonly CACHE_SIZE: number;

    /** */
    public readonly CORS_ORIGIN: string | string[];

    /** The URL of the database. */
    public readonly DATA: string;

    /** Enables serving static files by AAS Server. If the value is `true`, the AASBrowser web application is activated. */
    public readonly ENABLE_STATIC_FILES: boolean;

    /** The key file if AASServer supports HTTPS. */
    public readonly HTTPS_KEY_FILE?: string;

    /** The certificate file if AASServer supports HTTPS. */
    public readonly HTTPS_CERT_FILE?: string;

    /** The pfx file if AASServer supports HTTPS. */
    public readonly HTTPS_PFX_FILE?: string;

    /** The secret for HS256 encryption or the private key file for RS256 encryption. */
    public readonly JWT_SECRET: string;

    /** The public key file for RS256 encryption. */
    public readonly JWT_PUBLIC_KEY?: string;

    /** The validity of the JSON web token in seconds (bearer token). */
    public readonly JWT_EXPIRES_IN: number;

    /** The validity of the JSON web token in seconds (query parameter). */
    public readonly JWT_SHORT_EXP = 5;

    /** The maximum number of elements in a page result. */
    public readonly LIMIT: number;

    /** The number of items in a page. */
    public readonly PAGE_SIZE: number;

    /** The root directory for static files. */
    public readonly WEB_ROOT: string;

    /** The logging level. */
    public readonly LOG_LEVEL: 'Error' | 'Warning' | 'Info';

    public readonly KEYCLOAK_REALM = 'AASPortalRealm';
    public readonly KEYCLOAK_URL = 'http://localhost:8081';
    public readonly KEYCLOAK_ISSUER = 'http://localhost:8081/realms/AASPortalRealm';
    public readonly CLIENT_ID = 'aas-node-client';
    public readonly CLIENT_SECRET = 'qOMZp9x9xEiZ3DS5teaD1mL2TswSXa0Y';
    public readonly REDIRECT_URI = 'http://localhost:50010/callback';
    public readonly KEYCLOAK_AUTHORIZATION_URL = `${this.KEYCLOAK_ISSUER}/protocol/openid-connect/auth`;
    public readonly KEYCLOAK_TOKEN_URL = `${this.KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    public readonly KEYCLOAK_USERINFO_URL = `${this.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`;
}
