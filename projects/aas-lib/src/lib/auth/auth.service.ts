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
import { BehaviorSubject, from, last, map, mergeMap, Observable, of, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
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
    private readonly payload$ = new BehaviorSubject<JWTPayload>({ role: 'guest' });
    private readonly ready$ = new BehaviorSubject<boolean>(false);
    private readonly cookies = new Map<string, string>();

    constructor(
        private modal: NgbModal,
        private translate: TranslateService,
        private api: AuthApiService,
        private notify: NotifyService,
        private window: WindowService
    ) {
        this.payload = this.payload$.asObservable();
        this.ready = this.ready$.asObservable();

        const stayLoggedIn = toBoolean(this.window.getLocalStorageItem('.StayLoggedIn'));
        const token = this.window.getLocalStorageItem('.Token');
        if (stayLoggedIn && token && this.isValid(token)) {
            this.nextPayload(token);
            this.ready$.next(true);
            return;
        }

        this.loginAsGuest().subscribe({
            error: (error) => notify.error(error),
            complete: () => this.ready$.next(true)
        });
    }

    /** Signals that an authentication was performed. */
    public readonly ready: Observable<boolean>;

    /** The e-mail of the current user. */
    public get userId(): string | undefined {
        return this.payload$.getValue()?.sub;
    }

    /** The name or alias of the current user. */
    public get name(): string | undefined {
        return this.payload$.getValue()?.name ?? this.translate.instant('GUEST_USER');
    }

    /** The current user role. */
    public get role(): UserRole {
        return this.payload$.getValue()?.role ?? 'guest';
    }

    /** Indicates whether the current user is authenticated. */
    public get authenticated(): boolean {
        const payload = this.payload$.getValue();
        return payload.sub != null && (payload.role === 'editor' || payload.role === 'admin');
    }

    /** The current active JSON web token. */
    public readonly payload: Observable<JWTPayload>;

    /**
     * User login.
     * @param credentials The credentials.
     */
    public login(credentials?: Credentials): Observable<void> {
        if (credentials) {
            return this.api.login(credentials).pipe(map(result => this.nextPayload(result.token)));
        }

        return of(this.modal.open(LoginFormComponent, { backdrop: 'static', animation: true, keyboard: true })).pipe(
            mergeMap(modalRef => {
                const stayLoggedIn = toBoolean(this.window.getLocalStorageItem('.StayLoggedIn'));
                const token = this.window.getLocalStorageItem('.Token');
                if (stayLoggedIn && token) {
                    modalRef.componentInstance.stayLoggedIn = stayLoggedIn;
                }

                return from<Promise<LoginFormResult | undefined>>(modalRef.result);
            }),
            mergeMap(result => {
                if (result?.token) {
                    this.nextPayload(result.token);
                    if (result.stayLoggedIn) {
                        this.window.setLocalStorageItem('.StayLoggedIn', 'true');
                    } else if (toBoolean(this.window.getLocalStorageItem('.StayLoggedIn'))) {
                        this.window.removeLocalStorageItem('.StayLoggedIn');
                    }
                } else if (result?.action === 'register') {
                    return this.register();
                }

                return of(void 0);
            }));
    }

    /**
     * Ensures that the current user has the expected rights.
     * @param role The expected user role.
     */
    public ensureAuthorized(role: UserRole): Observable<void> {
        if (this.isAuthorized(role)) {
            return of(void 0);
        }

        return this.login().pipe(map(() => {
            if (!this.isAuthorized(role)) {
                throw new ApplicationError('Unauthorized access.', ERRORS.UNAUTHORIZED_ACCESS);
            }
        }));
    }

    /** Logs out the current user. */
    public logout(): Observable<void> {
        if (!this.userId) {
            return throwError(() => new Error('Invalid operation.'));
        }

        return this.loginAsGuest();
    }

    /**
     * Registers a new user.
     * @param profile The profile of the new user.
     */
    public register(profile?: UserProfile): Observable<void> {
        if (profile) {
            return this.api.register(profile).pipe(map(result => this.nextPayload(result.token)));
        }

        return of(this.modal.open(RegisterFormComponent, { backdrop: 'static', animation: true, keyboard: true })).pipe(
            mergeMap(modalRef => from<Promise<RegisterFormResult | undefined>>(modalRef.result)),
            map(result => {
                if (result) {
                    this.nextPayload(result.token);
                    if (result.stayLoggedIn) {
                        this.window.setLocalStorageItem('.StayLoggedIn', 'true');
                    } else {
                        this.window.removeLocalStorageItem('.StayLoggedIn');
                    }
                }
            }));
    }

    /**
     * Updates the profile of the current user.
     * @param profile The updated user profile.
     */
    public updateUserProfile(profile?: UserProfile): Observable<void> {
        const payload = this.payload$.getValue();
        if (!payload || !payload.sub || !payload.name) {
            return throwError(() => new Error('Invalid operation.'));
        }

        if (profile) {
            return this.api.updateProfile(payload.sub, profile).pipe(
                map(result => this.nextPayload(result.token)));
        }

        return of(this.modal.open(ProfileFormComponent, { backdrop: 'static', animation: true, keyboard: true })).pipe(
            mergeMap(form => {
                form.componentInstance.initialize({ id: payload.sub, name: payload.name });
                return from<Promise<ProfileFormResult>>(form.result)
            }),
            mergeMap(result => {
                if (result?.token) {
                    this.nextPayload(result.token);
                } else if (result?.action === 'deleteUser') {
                    const message = stringFormat(this.translate.instant('CMD_DELETE_USER'), this.userId);
                    if (this.window.confirm(message)) {
                        return this.deleteUser();
                    }
                }

                return of(void 0);
            }));
    }

    /**
     * Deletes the account of the current authenticated user.
     */
    public deleteUser(): Observable<void> {
        const payload = this.payload$.getValue();
        if (!payload || !payload.sub || !payload.name) {
            throw new Error('Invalid operation');
        }

        return this.api.delete(payload.sub).pipe(mergeMap(() => this.loginAsGuest()));
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
        const payload = this.payload$.getValue();
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
        const payload = this.payload$.getValue();
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
        const payload = this.payload$.getValue();
        if (payload && payload.sub) {
            const id = payload.sub;
            return this.api.deleteCookie(id, name).pipe(
                mergeMap(() => this.api.getCookies(id)),
                map(cookies => {
                    this.cookies.clear();
                    cookies.forEach(cookie => this.cookies.set(cookie.name, cookie.data));
                }));
        } else {
            this.window.removeLocalStorageItem(name);
            return of(void 0);
        }
    }

    private loginAsGuest(): Observable<void> {
        this.window.removeLocalStorageItem('.Token');
        this.window.removeLocalStorageItem('.StayLoggedIn');
        return this.api.guest().pipe(map(result => this.nextPayload(result.token)));
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
        this.payload$.next(payload);
        this.cookies.clear();
        if (payload.sub) {
            this.api.getCookies(payload.sub).subscribe({
                next: (cookies) => cookies.forEach(cookie => this.cookies.set(cookie.name, cookie.data)),
                error: (error) => this.notify.error(error)
            });
        }
    }
}