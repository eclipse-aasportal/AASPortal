/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NotifyService } from '../notify/notify.service';
import { AuthService } from './auth.service';

@Component({
    selector: 'fhg-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
    public constructor(
        private auth: AuthService,
        private notify: NotifyService,
    ) {}

    public get userAuthenticated(): boolean {
        return this.auth.authenticated;
    }

    public get userName(): string | undefined {
        return this.auth.name;
    }

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
