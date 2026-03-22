/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotifyService } from '../notify/notify.service';
import { TranslateDirective } from '@ngx-translate/core';
import { NgbDropdown, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap/dropdown';
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

    public readonly userAuthenticated = this.auth.authenticated;

    public readonly userName = this.auth.name;

    public register(): void {
        this.auth.register().subscribe({ error: error => this.notify.error(error) });
    }

    public login(): void {
        this.auth.login().subscribe({ error: error => this.notify.error(error) });
    }

    public logout(): void {
        this.auth.logout().subscribe({ error: error => this.notify.error(error) });
    }

    public updateUserProfile(): void {
        this.auth.updateUserProfile().subscribe({ error: error => this.notify.error(error) });
    }
}
