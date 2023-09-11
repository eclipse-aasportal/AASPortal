/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

declare module 'owncloud-sdk' {

    export interface OwnCloudAuthentication {
        basic?: { username: string; password: string; }
    }

    export interface OwnCloudOptions {
        baseUrl: string;
        auth?: OwnCloudAuthentication;
    }

    export default class ownCloud {
        constructor(options?: OwnCloudOptions);

        public login(): Promise<any>;
    }
}
