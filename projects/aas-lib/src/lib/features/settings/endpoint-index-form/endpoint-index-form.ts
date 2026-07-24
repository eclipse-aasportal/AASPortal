/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { from, interval, map, mergeMap, Observable, of, toArray, zip } from 'rxjs';
import { AASEndpointScheduleType } from 'aas-core';
import { IndexChange } from '../../../shared/services/index-change';
import { EndpointsApi } from '../../../shared/services/endpoints-api';
import { Duration } from '../../../shared/pipes/duration';
import { PromptDialog } from '../../../core/prompt-dialog/prompt-dialog';

export interface EndpointConsoleItem {
    name: string;
    aasCount: number;
    schedule: AASEndpointScheduleType;
    status: 'idle' | 'scanning';
    start: number;
    duration: number;
}

@Component({
    selector: 'fhg-endpoint-index-form',
    imports: [FormsModule, TranslateDirective, TranslatePipe, NgbTooltipModule, Duration],
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
        this.indexChange.endUpdate
            .pipe(
                takeUntilDestroyed(),
                mergeMap(event => zip(of(event), this.api.getDocumentCount(event.endpoint))),
            )
            .subscribe(([event, count]) => {
                this.items.update(items => {
                    return items.map(item => {
                        if (item.name === event.endpoint) {
                            return {
                                ...item,
                                aasCount: count,
                                start: 0,
                                duration: 0,
                                status: 'idle',
                            } satisfies EndpointConsoleItem;
                        }

                        return item;
                    });
                });
            });

        this.indexChange.startUpdate.pipe(takeUntilDestroyed()).subscribe(event => {
            this.items.update(items => {
                return items.map(item => {
                    if (item.name === event.endpoint) {
                        return {
                            ...item,
                            aasCount: 0,
                            start: event.start,
                            duration: Date.now() - event.start,
                            status: 'scanning',
                        } satisfies EndpointConsoleItem;
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
                            aasCount: 0,
                        } satisfies EndpointConsoleItem;
                    }

                    return item;
                });
            });
        });

        interval(1000)
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                this.items.update(items => {
                    return items.map(item => {
                        if (item.status === 'scanning') {
                            return {
                                ...item,
                                duration: Date.now() - item.start,
                            } satisfies EndpointConsoleItem;
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
                            aasCount: count,
                            status: status.status,
                            schedule,
                            start: status.status === 'idle' ? 0 : status.start,
                            duration: status.status === 'idle' ? 0 : Date.now() - status.start,
                        } satisfies EndpointConsoleItem;
                    }),
                ),
            ),
            { initialValue: [] as EndpointConsoleItem[] },
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
            PromptDialog.open(
                this.modal,
                this.translate.instant('EndpointIndexForm.CLEAR_INDEX_PROMPT', {
                    name,
                }),
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
