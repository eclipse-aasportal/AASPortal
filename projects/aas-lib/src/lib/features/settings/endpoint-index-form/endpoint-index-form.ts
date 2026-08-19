/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, effect, inject, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal, NgbModal, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, from, map, mergeMap, Observable, of, toArray, zip } from 'rxjs';
import { AASEndpointScheduleType } from 'aas-core';
import { IndexChange } from '../../../shared/services/index-change';
import { EndpointsApi } from '../../../shared/services/endpoints-api';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';

export interface EndpointIndexItem {
    name: string;
    count: number;
    schedule: AASEndpointScheduleType;
    status: 'idle' | 'scanning';
    progress: number;
    submodelCount: number;
}

@Component({
    selector: 'fhg-endpoint-index-form',
    imports: [FormsModule, TranslateDirective, TranslatePipe, NgbTooltipModule, NgbProgressbarModule],
    providers: [],
    templateUrl: './endpoint-index-form.html',
    styleUrl: './endpoint-index-form.scss',
})
export class EndpointIndexForm {
    private readonly activeModal = inject(NgbActiveModal);
    private readonly indexChange = inject(IndexChange);
    private readonly api = inject(EndpointsApi);
    private readonly translate = inject(TranslateService);
    private readonly modal = inject(NgbModal);

    public constructor() {
        this.indexChange.startUpdate.pipe(takeUntilDestroyed()).subscribe(event => {
            this.items.update(items => {
                return items.map(item => {
                    if (item.name === event.endpoint) {
                        return {
                            ...item,
                            count: 0,
                            status: 'scanning',
                            progress: -1,
                            submodelCount: 0,
                        } satisfies EndpointIndexItem;
                    }

                    return item;
                });
            });
        });

        this.indexChange.endUpdate.pipe(takeUntilDestroyed()).subscribe(event => {
            this.items.update(items => {
                return items.map(item => {
                    if (item.name === event.endpoint) {
                        return {
                            ...item,
                            status: 'idle',
                            progress: -1,
                        } satisfies EndpointIndexItem;
                    }

                    return item;
                });
            });
        });

        this.indexChange.cleared.pipe(takeUntilDestroyed()).subscribe(endpoint => {
            this.items.update(items => {
                return items.map(item => {
                    if (!endpoint || item.name === endpoint) {
                        return {
                            ...item,
                            count: 0,
                            submodelCount: 0,
                        } satisfies EndpointIndexItem;
                    }

                    return item;
                });
            });
        });

        effect(() => {
            const progress = this.indexChange.progress();
            this.items.update(items => {
                return items.map(item => {
                    if (item.name === progress.endpoint) {
                        return {
                            ...item,
                            progress: progress.progress,
                            count: progress.shellCount,
                            submodelCount: progress.submodelCount,
                        } satisfies EndpointIndexItem;
                    }

                    return item;
                });
            });
        });
    }

    public readonly items = linkedSignal(
        toSignal(
            this.api.getEndpoints().pipe(
                mergeMap(endpoints => of(...endpoints)),
                filter(endpoint => endpoint.schedule?.type !== 'disabled'),
                mergeMap(endpoint =>
                    zip(
                        this.indexChange.getUpdateStatus(endpoint.name),
                        this.api.getDocumentCount(endpoint.name),
                        of(endpoint.schedule?.type ?? 'every'),
                    ),
                ),
                toArray(),
                map(items =>
                    items.map(([status, count, schedule]) => {
                        return {
                            name: status.name,
                            count: count,
                            status: status.status,
                            schedule,
                            progress: -1,
                            submodelCount: 0,
                        } satisfies EndpointIndexItem;
                    }),
                ),
            ),
            { initialValue: [] as EndpointIndexItem[] },
        ),
    );

    public close(): void {
        this.activeModal.close();
    }

    public submit(event: Event): void {
        event.preventDefault();
        this.activeModal.close();
    }

    public clearIndex(endpoint?: string): Observable<void> {
        const name = endpoint ?? this.translate.instant('EndpointIndexForm.CLEAR_INDEX_KEY');
        return from(
            PromptDialog.confirm(
                this.modal,
                this.translate.instant('EndpointIndexForm.CLEAR_INDEX_PROMPT', {
                    name,
                }),
                name,
            ),
        ).pipe(
            mergeMap(value => {
                if (value !== name) {
                    return of(void 0);
                }

                return this.indexChange.clearIndex(endpoint);
            }),
        );
    }

    public startScan(endpoint: string): Observable<void> {
        return this.indexChange.startUpdateIndex(endpoint);
    }

    public cancelScan(endpoint: string): Observable<void> {
        return this.indexChange.cancelUpdateIndex(endpoint);
    }
}
