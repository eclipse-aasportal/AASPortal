/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from "@angular/core";
import { NotifyService } from "../notify/notify.service";
import { AuthService } from "./auth.service";

@Component({
    selector: "fhg-auth",
    templateUrl: "./auth.component.html",
    styleUrls: ["./auth.component.scss"],
})
export class AuthComponent {
    constructor(
        private auth: AuthService,
        private notify: NotifyService) { }

    public get userAuthenticated(): boolean {
        return this.auth.authenticated;
    }

    public get userName(): string | undefined {
        return this.auth.name;
    }

    public async registerUser(): Promise<void> {
        try {
            await this.auth.registerAsync();
        } catch (error) {
            this.notify.error(error);
        }
    }

    public async loginUser(): Promise<void> {
        try {
            await this.auth.loginAsync();
        } catch (error) {
            this.notify.error(error);
        }
    }

    public async logoutUser(): Promise<void> {
        try {
            await this.auth.logoutAsync();
        } catch (error) {
            this.notify.error(error);
        }
    }

    public async updateUserProfile(): Promise<void> {
        try {
            await this.auth.updateUserProfileAsync();
        } catch (error) {
            this.notify.error(error);
        }
    }
}