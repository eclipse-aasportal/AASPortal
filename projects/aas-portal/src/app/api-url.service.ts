/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApiUrl, encodeBase64Url, WindowService } from 'aas-lib';
import { environment } from '../environments/environment';

export class ApiUrlService implements ApiUrl {
    private readonly baseUrl: URL;

    public constructor(window: WindowService) {
        this.baseUrl = new URL(window.location.origin);
        this.baseUrl.pathname = environment.basePath;
    }

    public join(path: string, queryParams?: Record<string, string>): string {
        const url = new URL(path, this.baseUrl);
        if (queryParams) {
            for (const name in queryParams) {
                url.searchParams.set(name, queryParams[name]);
            }
        }

        return url.toString();
    }

    public getFileUrl(endpoint: string, id: string, submodelId: string, idShortPath: string): string {
        return this.join(
            `endpoints/${encodeBase64Url(endpoint)}/documents/${encodeBase64Url(id)}/submodels/${encodeBase64Url(submodelId)}/submodel-elements/${idShortPath}/value`,
        );
    }
}
