/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { httpResource } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { jsonization, TemplateDescriptor, types } from 'aas-core';

@Injectable({
    providedIn: 'root',
})
export class TemplateService {
    private readonly templates$ = httpResource<TemplateDescriptor[]>(() => '/assets/published-idta-templates.json');

    /**
     * Gets the names of the available submodel-templates.
     */
    public readonly templates = computed(() => {
        const values = this.templates$.value();
        if (!values) {
            return [];
        }

        return [...new Set(values.map(value => value.name))].sort();
    });

    /**
     * Reactive signal that holds the currently selected template name.
     *
     * The signal's value is either a string representing the template or `undefined`
     * when no template is selected. It is initialized to `undefined`.
     *
     * @readonly
     * @type {string | undefined}
     * @default undefined
     */
    public readonly template = signal<string | undefined>(undefined);

    /**
     * Retrieves the currently selected template as a resolved Environment object.
     *
     * @returns A promise that resolves to the loaded types.Environment, or undefined when no template name or URL is found.
     *
     * @throws {Error} Propagates errors from fetch (network failures), from response.json() (invalid JSON),
     *                 or from jsonization.environmentFromJsonable(...).mustValue() (invalid or unconvertible data).
     */
    public async getTemplate(): Promise<types.Environment | undefined> {
        const name = this.template();
        if (!name) {
            return;
        }

        const url = this.templates$.value()?.find(value => value.name === name)?.url;
        if (!url) {
            return;
        }

        const response = await fetch(url);
        return jsonization.environmentFromJsonable(await response.json()).mustValue();
    }
}
