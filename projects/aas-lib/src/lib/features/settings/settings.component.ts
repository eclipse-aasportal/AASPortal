/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective } from '@ngx-translate/core';
import { catchError, concat, from, map, mergeMap, Observable, of, tap } from 'rxjs';
import { AASEndpoint } from 'aas-core';
import { AuthService } from '../../core/auth/auth.service';
import { AddEndpointForm } from './add-endpoint-form/add-endpoint-form';
import { ExtrasEndpointFormComponent } from './extras-endpoint-form/extras-endpoint-form.component';
import { UpdateEndpointForm, UpdateEndpointResult } from './update-endpoint-form/update-endpoint-form';
import { EndpointsApi } from '../../services/endpoints-api';
import { NotifyService } from '../../core/notify/notify.service';

@Component({
    selector: 'fhg-settings',
    imports: [NgbDropdownModule, TranslateDirective],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
    public readonly auth = inject(AuthService);
    private readonly modal = inject(NgbModal);
    private readonly api = inject(EndpointsApi);
    private readonly notify = inject(NotifyService);

    /**
     * Adds a new AAS endpoint.
     * This operation requires specific permissions.
     *
     * @returns An Observable that completes when the endpoint is successfully added,
     *          or emits an error if the operation fails. Returns EMPTY if user cancels the operation.
     * @throws Will be caught and handled by the notification service
     */
    public addEndpoint(): Observable<void> {
        if (!this.auth.isAuthenticated()) {
            return this.auth.login();
        }

        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.modal.open(AddEndpointForm, { backdrop: 'static' })),
            mergeMap(modalRef => from<Promise<AASEndpoint | undefined>>(modalRef.result)),
            mergeMap(endpoint => {
                if (!endpoint) {
                    return of(void 0);
                }

                return this.api.addEndpoint(endpoint).pipe(
                    tap(() => this.notify.info('Settings.AAS_ENDPOINT_ADDED', { endpoint: endpoint.name })),
                    catchError(error => {
                        this.notify.error(error);
                        return of(void 0);
                    }),
                );
            }),
        );
    }

    /**
     * Updates the configuration of an AAS endpoint.
     * This operation requires specific permissions.
     *
     * @returns An Observable that completes when the endpoint is updated, or emits an error if the operation fails
     * @throws Error if unauthorized, endpoint retrieval fails, or update operation fails
     */
    public updateEndpoint(): Observable<void> {
        if (!this.auth.isAuthenticated()) {
            return this.auth.login();
        }

        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.modal.open(UpdateEndpointForm, { backdrop: 'static' })),
            mergeMap(modalRef => from<Promise<UpdateEndpointResult>>(modalRef.result)),
            mergeMap(result => {
                if (!result) {
                    return of(void 0);
                }

                return concat(
                    of(...result.update).pipe(
                        mergeMap(endpoint =>
                            this.api.updateEndpoint(endpoint).pipe(
                                tap(() =>
                                    this.notify.info('Settings.AAS_ENDPOINT_UPDATED', { endpoint: endpoint.name }),
                                ),
                                catchError(error => {
                                    this.notify.error(error);
                                    return of(void 0);
                                }),
                            ),
                        ),
                    ),
                    of(...result.delete).pipe(
                        mergeMap(name =>
                            this.api.removeEndpoint(name).pipe(
                                tap(() => this.notify.info('Settings.AAS_ENDPOINT_DELETED', { endpoint: name })),
                                catchError(error => {
                                    this.notify.error(error);
                                    return of(void 0);
                                }),
                            ),
                        ),
                    ),
                );
            }),
        );
    }

    /**
     * Opens the extras dialog.
     * This operation requires specific permissions.
     *
     * @returns An Observable that completes when the dialog has been closed.
     */
    public extras(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => {
                const modalRef = this.modal.open(ExtrasEndpointFormComponent, { backdrop: 'static', scrollable: true });
                return from(modalRef.result);
            }),
        );
    }
}
