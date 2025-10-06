/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, TemplateRef, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AASApi } from './aas-api';
import { ToolbarService, BrowserComponent, BrowserState } from 'aas-lib';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrl: './aas.component.scss',
    imports: [FormsModule, BrowserComponent],
    providers: [BrowserState],
    changeDetection: ChangeDetectionStrategy.OnPush,
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
            const startToolbar = this.aasToolbar();
            if (startToolbar) {
                this.toolbar.set(startToolbar);
            }
        });
    }

    public readonly aasToolbar = viewChild<TemplateRef<unknown>>('aasToolbar');

    public readonly env = this.api.env.value.asReadonly();

    public readonly state = inject(BrowserState);
}
