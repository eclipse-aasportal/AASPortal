/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Injectable, computed } from '@angular/core';
import { Observable, map } from 'rxjs';
import { aas, Endpoint, TemplateDescriptor } from 'aas-core';
import { encodeBase64Url } from './utilities';

interface TemplateServiceState {
    templates: TemplateDescriptor[];
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})
export class TemplateService {
    private readonly state = toSignal(
        this.http
            .get<TemplateDescriptor[]>('/api/v1/templates')
            .pipe(map(values => ({ templates: values, timestamp: Date.now() }) as TemplateServiceState)),
        { initialValue: { templates: [], timestamp: 0 } as TemplateServiceState },
    );

    public constructor(private readonly http: HttpClient) {}

    /** Gets the list of available templates. */
    public readonly templates = computed(() => this.state().templates);

    /**
     * Gets the template from the specified endpoint.
     * @param endpoint The template endpoint.
     * @returns The template.
     */
    public getTemplate(endpoint: Endpoint): Observable<aas.Referable | aas.Environment> {
        return this.http.get<aas.Referable | aas.Environment>(`/api/v1/templates/${encodeBase64Url(endpoint.address)}`);
    }
}
