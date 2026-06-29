/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { catchError, mergeMap, Observable, of } from 'rxjs';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap/dropdown';
import { Router } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { NotifyService } from '../notify/notify.service';
import { AuthService } from './auth.service';

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

    public readonly isAuthenticated = this.auth.isAuthenticated;

    public readonly userName = this.auth.name;

    public logout(): Observable<void> {
        return this.auth.logout().pipe(
            catchError(error => of(this.notify.handleError(error))),
            mergeMap(() => this.router.navigateByUrl('/start').then(() => void 0)),
        );
    }
}
