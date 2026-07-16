/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, effect, TemplateRef, viewChild, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToolbarService, BrowserComponent, BrowserState, encodeBase64Url } from 'aas-lib';
import { isSubmodel, isSubmodelElementList } from 'aas-core';

import { AASApi } from './aas-api';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrl: './aas.component.scss',
    imports: [FormsModule, BrowserComponent],
    providers: [BrowserState],
})
export class AASComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly toolbar = inject(ToolbarService);
    private readonly api = inject(AASApi);

    public constructor() {
        this.route.paramMap
            .pipe(
                switchMap(params => of(params.get('aasId'))),
                takeUntilDestroyed(),
            )
            .subscribe(aasId => {
                if (aasId && aasId !== ':aasId') {
                    this.api.aasId.set(aasId);
                }
            });

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly env = this.api.env.value.asReadonly();

    public readonly state = inject(BrowserState);

    public readonly id = computed(() => {
        const path = this.state.path();
        const current = this.state.current()?.referable;
        const referable = path.at(1)?.referable ?? current;
        return isSubmodel(referable) ? encodeBase64Url(referable.id) : undefined;
    });

    public readonly idShortPath = computed(() => {
        const current = this.state.current()?.referable;
        if (current === undefined) {
            return undefined;
        }

        const path = [...this.state.path().map(item => item.referable), current];
        if (path.length < 2) {
            return undefined;
        }

        let parent = path[1];
        let idShortPath = '';
        for (let i = 2, n = path.length; i < n; i++) {
            const item = path[i];
            if (!idShortPath) {
                idShortPath = item.idShort;
            } else if (isSubmodelElementList(parent)) {
                idShortPath += '[' + parent.value!.indexOf(item) + ']';
            } else {
                idShortPath += '.' + item.idShort;
            }

            parent = item;
        }

        return idShortPath;
    });

    public copyToClipboard(value: string | undefined): void {
        if (value) {
            navigator.clipboard.writeText(value);
        }
    }
}
