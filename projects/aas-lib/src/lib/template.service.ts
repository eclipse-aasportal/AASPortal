/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { aas, Endpoint, TemplateDescriptor } from 'common';
import { encodeBase64Url } from './convert';

interface TemplateServiceState {
    templates: TemplateDescriptor[];
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})
export class TemplateService {
    private readonly state = new BehaviorSubject<TemplateServiceState>({ templates: [], timestamp: 0 });

    public constructor(private readonly http: HttpClient) {
        this.http
            .get<TemplateDescriptor[]>('/api/v1/templates')
            .pipe(map(values => this.state.next({ templates: values, timestamp: Date.now() })))
            .subscribe();
    }

    /**
     * Gets the list of available templates.
     * @returns An array of `TemplateDescriptor` items.
     */
    public getTemplates(): Observable<TemplateDescriptor[]> {
        return this.state.asObservable().pipe(map(state => state.templates));
    }

    /**
     * Gets the template from the specified endpoint.
     * @param endpoint The template endpoint.
     * @returns The template.
     */
    public getTemplate(endpoint: Endpoint): Observable<aas.Referable> {
        return this.http.get<aas.Referable>(`/api/v1/templates/${encodeBase64Url(endpoint.address)}`);
    }
}
