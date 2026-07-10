/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { catchError, from, mergeMap, Observable, of, tap } from 'rxjs';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { EndpointAuth } from 'aas-core';
import { NotifyService } from '../notify/notify.service';
import { AuthService } from './auth.service';
import { EndpointAuthForm } from './endpoint-auth-form/endpoint-auth-form';
import { EndpointsApi } from '../../services/endpoints-api';

@Component({
    selector: 'fhg-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, TranslateDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly router = inject(Router);
    private readonly modal = inject(NgbModal);

    public readonly isAuthenticated = this.auth.isAuthenticated;

    public readonly userName = this.auth.name;

    public logout(): Observable<void> {
        return this.auth.logout().pipe(
            catchError(error => of(this.notify.handleError(error))),
            mergeMap(() => this.router.navigateByUrl('/start').then(() => void 0)),
        );
    }

    public openEndpointAuth(): Observable<void> {
        if (!this.auth.isAuthenticated()) {
            return this.auth.login();
        }

        return from<Promise<EndpointAuth[]>>(
            this.modal.open(EndpointAuthForm, { backdrop: 'static', scrollable: true }).result,
        ).pipe(
            mergeMap(items =>
                this.auth.updateEndpointAuth(items).pipe(
                    tap(() =>
                        this.notify.info('EndpointAuthForm.UPDATED', {
                            endpoints: items.map(item => item.name).join(', '),
                        }),
                    ),
                    catchError(error => of(this.notify.error(error))),
                ),
            ),
        );
    }
}
