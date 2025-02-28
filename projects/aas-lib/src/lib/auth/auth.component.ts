/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NotifyService } from '../notify/notify.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from './auth.service';

@Component({
    selector: 'fhg-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
    imports: [NgbModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthComponent {
    public constructor(
        private auth: AuthService,
        private notify: NotifyService,
    ) {}

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
