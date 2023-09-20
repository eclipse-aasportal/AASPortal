/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY, last, map, mergeMap, Observable } from 'rxjs';
import jwtDecode from 'jwt-decode';
import {
    ApplicationError,
    Credentials,
    isUserAuthorized,
    stringFormat,
    UserProfile,
    UserRole,
    JWTPayload,
    toBoolean
} from 'common';

import { NotifyService } from '../notify/notify.service';
import { ERRORS } from '../types/errors';
import { LoginFormComponent, LoginFormResult } from '../auth/login-form/login-form.component';
import { ProfileFormComponent, ProfileFormResult } from '../auth/profile-form/profile-form.component';
import { RegisterFormComponent, RegisterFormResult } from '../auth/register-form/register-form.component';
import { AuthApiService } from './auth-api.service';
import { WindowService } from '../window.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly $payload = new BehaviorSubject<JWTPayload>({ role: 'guest' });
    private readonly cookies = new Map<string, string>();

    constructor(
        private modal: NgbModal,
        private translate: TranslateService,
        private api: AuthApiService,
        private notify: NotifyService,
        private window: WindowService
    ) {
        this.payload = this.$payload.asObservable();

        const stayLoggedIn = toBoolean(this.window.getLocalStorageItem('.StayLoggedIn'));
        let token = this.window.getLocalStorageItem('.Token');
        if (stayLoggedIn && token) {
            if (this.isValid(token)) {
                this.nextPayload(token);
            } else {
                token = null;
            }
        } else {
            token = null;
        }

        if (!token) {
            this.loginAsGuestAsync().catch(error => notify.error(error));
        }
    }

    /** The e-mail of the current user. */
    public get userId(): string | undefined {
        return this.$payload.getValue()?.sub;
    }

    /** The name or alias of the current user. */
    public get name(): string | undefined {
        return this.$payload.getValue()?.name ?? this.translate.instant('GUEST_USER');
    }

    /** The current user role. */
    public get role(): UserRole {
        return this.$payload.getValue()?.role ?? 'guest';
    }

    /** Indicates whether the current user is authenticated. */
    public get authenticated(): boolean {
        const payload = this.$payload.getValue();
        return payload.sub != null && (payload.role === 'editor' || payload.role === 'admin');
    }

    /** The current active JSON web token. */
    public readonly payload: Observable<JWTPayload>;

    /**
     * User login.
     * @param credentials The credentials.
     */
    public async loginAsync(credentials?: Credentials): Promise<void> {
        if (credentials) {
            const result = await this.api.loginAsync(credentials);
            this.nextPayload(result.token);
        } else {
            const modalRef = this.modal.open(LoginFormComponent, { backdrop: 'static', animation: true, keyboard: true });
            const stayLoggedIn = toBoolean(this.window.getLocalStorageItem('.StayLoggedIn'));
            const token = this.window.getLocalStorageItem('.Token');
            if (stayLoggedIn && token) {
                modalRef.componentInstance.stayLoggedIn = stayLoggedIn;
            }

            const result: LoginFormResult = await modalRef.result;
            if (result != null) {
                if (result.token) {
                    this.nextPayload(result.token);
                    if (result.stayLoggedIn) {
                        this.window.setLocalStorageItem('.StayLoggedIn', 'true');
                    } else if (stayLoggedIn) {
                        this.window.removeLocalStorageItem('.StayLoggedIn');
                    }
                } else if (result.action === 'register') {
                    await this.registerAsync();
                }
            }
        }
    }

    /**
     * Ensures that the current user has the expected rights.
     * @param role The expected user role.
     */
    public async ensureAuthorizedAsync(role: UserRole): Promise<void> {
        if (!this.isAuthorized(role)) {
            await this.loginAsync();
            if (!this.isAuthorized(role)) {
                throw new ApplicationError('Unauthorized access.', ERRORS.UNAUTHORIZED_ACCESS);
            }
        }
    }

    /** Logs out the current user. */
    public async logoutAsync(): Promise<void> {
        if (!this.userId) {
            throw new Error('Invalid operation.');
        }

        await this.loginAsGuestAsync();
    }

    /**
     * Registers a new user.
     * @param profile The profile of the new user.
     */
    public async registerAsync(profile?: UserProfile): Promise<void> {
        if (profile) {
            const result = await this.api.registerUserAsync(profile);
            this.nextPayload(result.token);
        } else {
            const modalRef = this.modal.open(
                RegisterFormComponent, {
                backdrop: 'static',
                animation: true,
                keyboard: true
            });

            const result: RegisterFormResult = await modalRef.result;
            if (result) {
                this.nextPayload(result.token);
                if (result.stayLoggedIn) {
                    this.window.setLocalStorageItem('.StayLoggedIn', 'true');
                } else {
                    this.window.removeLocalStorageItem('.StayLoggedIn');
                }
            }
        }
    }

    /**
     * Updates the profile of the current user.
     * @param profile The updated user profile.
     */
    public async updateUserProfileAsync(profile?: UserProfile): Promise<void> {
        const payload = this.$payload.getValue();
        if (!payload || !payload.sub || !payload.name) {
            throw new Error('Invalid operation.');
        }

        if (profile) {
            const result = await this.api.updateProfileAsync(payload.sub, profile);
            this.nextPayload(result.token);
        } else {
            profile = { id: payload.sub, name: payload.name };
            const form = this.modal.open(
                ProfileFormComponent, {
                backdrop: 'static',
                animation: true,
                keyboard: true
            });

            form.componentInstance.initialize(profile);
            const result: ProfileFormResult = await form.result;
            if (result) {
                if (result.token) {
                    this.nextPayload(result.token);
                } else if (result.action === 'deleteUser') {
                    const message = stringFormat(this.translate.instant('CMD_DELETE_USER'), this.userId);
                    if (this.window.confirm(message)) {
                        await this.deleteUserAsync();
                    }
                }
            }
        }
    }

    /**
     * Deletes the account of the current authenticated user.
     */
    public async deleteUserAsync(): Promise<void> {
        const payload = this.$payload.getValue();
        if (!payload || !payload.sub || !payload.name) {
            throw new Error('Invalid operation');
        }

        await this.api.deleteUserAsync(payload.sub);
        await this.loginAsGuestAsync();
    }

    /**
     * Determines whether the current user is authorized for the specified roles.
     * @param expected The expected role, the current user must have.
     */
    public isAuthorized(expected: UserRole): boolean {
        return isUserAuthorized(this.role, expected);
    }

    /**
     * Indicates whether a cookie with the specified name exists.
     * @param name The cookie name.
     * @returns `true` if the cookie exists; otherwise, `false`.
     */
    public checkCookie(name: string): boolean {
        if (this.authenticated) {
            return this.cookies.has(name);
        }

        return this.window.getLocalStorageItem(name) != null;
    }

    /**
     * Gets the value of the cookie with the specified name.
     * @param name The cookie name.
     * @returns The cookie value.
     */
    public getCookie(name: string): string | null {
        let data: string | null;
        const payload = this.$payload.getValue();
        if (payload) {
            data = this.cookies.get(name) ?? null;
        } else {
            data = this.window.getLocalStorageItem(name);
        }

        return data;
    }

    /**
     * Sets the value of the cookie with the specified name.
     * @param name The cookie name.
     * @param data The cookie value.
     */
    public setCookie(name: string, data: string): void {
        const payload = this.$payload.getValue();
        if (payload && payload.sub) {
            const id = payload.sub;
            this.api.setCookie(id, { name, data }).pipe(
                last(),
                mergeMap(() => this.api.getCookies(id))).subscribe(
                    {
                        next: (cookies) => cookies.forEach(cookie => this.cookies.set(cookie.name, cookie.data)),
                        error: (error) => this.notify.error(error)
                    });
        } else {
            this.window.setLocalStorageItem(name, data);
        }
    }

    /**
     * Deletes the cookie with the specified name.
     * @param name The cookie name.
     */
    public deleteCookie(name: string): Observable<void> {
        const payload = this.$payload.getValue();
        if (payload && payload.sub) {
            const id = payload.sub;
            return this.api.deleteCookie(id, name).pipe(
                mergeMap(() => {
                    const values = this.api.getCookies(id);
                    return values;
                }),
                map(cookies => {
                    this.cookies.clear();
                    cookies.forEach(cookie => this.cookies.set(cookie.name, cookie.data));
                }));
        } else {
            this.window.removeLocalStorageItem(name);
            return EMPTY;
        }
    }

    private async loginAsGuestAsync(): Promise<void> {
        this.window.removeLocalStorageItem('.Token');
        this.window.removeLocalStorageItem('.StayLoggedIn');
        const result = await this.api.guestAsync();
        this.nextPayload(result.token);
    }

    private isValid(token: string): boolean {
        try {
            const value = jwtDecode(token) as JWTPayload;
            return value.exp == null || (Date.now() / 1000 < value.exp);
        } catch (error) {
            return false;
        }
    }

    private nextPayload(token: string): void {
        this.window.setLocalStorageItem('.Token', token);
        const payload = jwtDecode(token) as JWTPayload;
        this.$payload.next(payload);
        this.cookies.clear();
        if (payload.sub) {
            this.api.getCookies(payload.sub).subscribe({
                next: (cookies) => cookies.forEach(cookie => this.cookies.set(cookie.name, cookie.data)),
                error: (error) => this.notify.error(error)
            });
        }
    }
}