/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton } from 'tsyringe';
import path from 'path/posix';

@singleton()
export class Variable {
    public constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET ?? 'The quick brown fox jumps over the lazy dog.';
        this.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY;
        this.JWT_EXPIRES_IN = process.env.JWT_EXPIRED_IN ? Number(process.env.JWT_EXPIRED_IN) : 604800;
        this.AAS_NODE_PORT = Number(process.env.AAS_NODE_PORT ?? '1337');
        this.MAX_WORKERS = process.env.MAX_WORKERS ? Number(process.env.MAX_WORKERS) : 8;
        this.USER_STORAGE = process.env.USER_STORAGE;
        this.TEMPLATE_STORAGE = process.env.TEMPLATE_STORAGE ?? 'file:///templates';
        this.CORS_ORIGIN = process.env.CORS_ORIGIN ? JSON.parse(process.env.CORS_ORIGIN) : '*';
        this.CONTENT_ROOT = path.resolve(process.env.CONTENT_ROOT ?? './');
        this.WEB_ROOT = path.resolve(process.env.WEB_ROOT ?? './wwwroot');
        this.ASSETS = path.resolve(process.env.ASSETS ?? './assets');
        this.ENDPOINTS = process.env.ENDPOINTS ? JSON.parse(process.env.ENDPOINTS) : ['file:///samples?name=Samples'];
        this.SCAN_TEMPLATES_TIMEOUT = process.env.SCAN_TEMPLATES_TIMEOUT
            ? Number(process.env.SCAN_TEMPLATES_TIMEOUT)
            : 3600000;

        this.SCAN_ENDPOINT_TIMEOUT = process.env.SCAN_ENDPOINT_TIMEOUT
            ? Number(process.env.SCAN_ENDPOINT_TIMEOUT)
            : 3600000;

        this.HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE;
        this.HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE;
        this.HTTPS_PFX_FILE = process.env.HTTPS_PFX_FILE;
        this.AAS_EXPIRES_IN = process.env.AAS_EXPIRES_IN ? Number(process.env.AAS_EXPIRES_IN) : 86400000;
        this.AAS_INDEX = process.env.AAS_INDEX;
        this.AAS_NODE_USERNAME = process.env.AAS_NODE_USERNAME ?? 'aas-server';
        this.AAS_NODE_PASSWORD = process.env.AAS_NODE_PASSWORD ?? 'aas-server';
    }

    /** The secret for HS256 encryption or the private key file for RS256 encryption. */
    public readonly JWT_SECRET: string;

    /** The public key file for RS256 encryption. */
    public readonly JWT_PUBLIC_KEY?: string;

    /** The validity of the JSON web token in seconds (bearer token). */
    public readonly JWT_EXPIRES_IN: number;

    /** The validity of the JSON web token in seconds (query parameter). */
    public readonly JWT_SHORT_EXP = 5;

    /** The port of the AASNode. */
    public readonly AAS_NODE_PORT: number;

    /** The number of worker threads. */
    public readonly MAX_WORKERS: number;

    /** The URL of the user storage. */
    public readonly USER_STORAGE?: string;

    /** The URL of the template storage. */
    public readonly TEMPLATE_STORAGE: string;

    /** */
    public readonly CORS_ORIGIN: string | string[];

    /** The directory where the AASNode app is located. */
    public readonly CONTENT_ROOT: string;

    /** The root directory for static files. */
    public readonly WEB_ROOT: string;

    /** The assets directory. */
    public readonly ASSETS: string;

    /** The URLs of the initial AAS container endpoints. */
    public readonly ENDPOINTS: string[];

    /** The time before a new endpoint scan starts.*/
    public readonly SCAN_ENDPOINT_TIMEOUT: number;

    /** The time before a new template scan starts. */
    public readonly SCAN_TEMPLATES_TIMEOUT: number;

    /** The key file if AASNode supports HTTPS. */
    public readonly HTTPS_KEY_FILE?: string;

    /** The certificate file if AASNode supports HTTPS. */
    public readonly HTTPS_CERT_FILE?: string;

    /** The pfx file if AASNode supports HTTPS. */
    public readonly HTTPS_PFX_FILE?: string;

    /** The validity period of an AAS in milliseconds. */
    public readonly AAS_EXPIRES_IN: number;

    /** The AASIndex realization. */
    public readonly AAS_INDEX?: string;

    /** The user name of AASNode (default: aas-server) */
    public readonly AAS_NODE_USERNAME: string;

    /** The root password. */
    public readonly AAS_NODE_PASSWORD: string;
}
