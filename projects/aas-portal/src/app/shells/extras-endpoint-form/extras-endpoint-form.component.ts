/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Signal, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbCollapse, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpointScheduleType, convertToString } from 'aas-core';
import { ExtrasEndpointService } from './extras-endpoint.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, map, mergeMap, toArray } from 'rxjs';

export type ExtrasEndpointItem = {
    name: string;
    url: string;
    count: number;
    schedule: AASEndpointScheduleType;
};

@Component({
    selector: 'fhg-extras-endpoint',
    imports: [FormsModule, NgbToast, NgbCollapse, TranslateModule],
    providers: [ExtrasEndpointService],
    templateUrl: './extras-endpoint-form.component.html',
    styleUrl: './extras-endpoint-form.component.scss',
})
export class ExtrasEndpointFormComponent {
    private readonly _messages = signal<string[]>([]);
    private readonly _endpoints: Signal<ExtrasEndpointItem[]>;

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly translate: TranslateService,
        private readonly api: ExtrasEndpointService,
    ) {
        this._endpoints = toSignal(
            api.getEndpoints().pipe(
                mergeMap(values =>
                    from(values).pipe(
                        mergeMap(value =>
                            this.api.getDocumentCount(value.name).pipe(
                                map(
                                    count =>
                                        ({
                                            name: value.name,
                                            url: value.url,
                                            count,
                                            schedule: value.schedule?.type || 'every',
                                        }) as ExtrasEndpointItem,
                                ),
                            ),
                        ),
                    ),
                ),
                toArray(),
            ),
            { initialValue: [] as ExtrasEndpointItem[] },
        );
    }

    public readonly messages = this._messages.asReadonly();

    public readonly endpoints = computed(() => this._endpoints().map(item => item));

    public readonly isCollapsed = signal(true);

    public submit(): void {
        this.modal.close();
    }

    public reset(): void {
        this.api
            .reset()
            .pipe()
            .subscribe({
                next: () => this.modal.close(),
                error: error =>
                    this._messages.update(state => [...state, convertToString(error, this.translate.currentLang)]),
            });
    }

    public scan(endpointName: string): void {
        this.api
            .scan(endpointName)
            .pipe()
            .subscribe({
                next: () => this.modal.close(),
                error: error =>
                    this._messages.update(state => [...state, convertToString(error, this.translate.currentLang)]),
            });
    }
}
