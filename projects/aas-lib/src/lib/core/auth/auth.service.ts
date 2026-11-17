/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, computed, signal, DOCUMENT, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { interval, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import {
    UserProfile,
    UserRole,
    Credentials,
    AASEndpointAuth,
    SessionUser,
    ApplicationError,
    isUserAuthorized,
} from 'aas-core';
import { DocumentCache } from '../../shared/services/document-cache';
import { ERRORS } from '../../messages';
import { WINDOW } from '../../shared/services/window.service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly cache = inject(DocumentCache);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly document = inject(DOCUMENT);
    private readonly translate = inject(TranslateService);
    private readonly window = inject(WINDOW);
    private readonly _user = signal<SessionUser | null | undefined>(undefined);

    public constructor() {
        this.http.get<SessionUser | null>('/auth/me').subscribe({
            next: user => {
                this.setUser(user);
            },
            error: error => {
                this.setUser(null);
                console.error(error);
            },
        });

        effect(onCleanup => {
            if (!this.isAuthenticated()) {
                return;
            }

            const subscription = interval(30_000)
                .pipe(switchMap(() => this.http.get<SessionUser | null>('/auth/me')))
                .subscribe({
                    next: user => {
                        if (user === null) {
                            this.setUser(null);
                        }
                    },
                    error: () => {
                        this.setUser(null);
                    },
                });

            onCleanup(() => subscription.unsubscribe());
        });
    }

    /** Signals that an authentication was performed. */
    public readonly ready = toObservable(computed(() => this._user() !== undefined));

    /** The e-mail of the current user. */
    public readonly email = computed(() => this._user()?.id);

    /** The name or alias of the current user. */
    public readonly name = computed(() => this._user()?.name);

    /** The current user role. */
    public readonly role = computed(() => this._user()?.role);

    /** Indicates whether the current user is authenticated. */
    public readonly isAuthenticated = computed(() => this._user() != null);

    /** The current active user. */
    public readonly user = this._user.asReadonly();

    /**
     * Ensures that the current user has the expected rights.
     * @param requiredRole The minimum required role.
     */
    public checkAuthorized(requiredRole: UserRole): Observable<void> {
        return this.isAuthorized(requiredRole)
            ? of(void 0)
            : throwError(
                  () =>
                      new ApplicationError(ERRORS.UNAUTHORIZED_ACCESS, {
                          role: this.translate.instant(`UserRole.${requiredRole}`),
                      }),
              );
    }

    /**
     * Performs user authentication using the provided credentials.
     * Sends a POST request to the '/auth/login' endpoint with the credentials.
     * @param credentials The credentials object containing the login information.
     * @returns An observable that completes when the user is authenticated.
     */
    public login(credentials?: Credentials): Observable<void> {
        if (this.isAuthenticated()) {
            return of(void 0);
        }

        if (!credentials) {
            return of(this.document.location.assign('/auth/login'));
        }

        return this.activeRoute.queryParamMap.pipe(
            take(1),
            switchMap(params => {
                const callback = params.get('redirect_uri');
                const client_id = params.get('client_id');
                const state = params.get('state');
                const code_challenge_method = params.get('code_challenge_method');
                const code_challenge = params.get('code_challenge');
                if (!callback || !client_id || !state || !code_challenge_method || !code_challenge) {
                    return throwError(() => new Error('Invalid login request: Missing required query parameters.'));
                }

                const queryParams = new HttpParams({
                    fromObject: {
                        client_id,
                        state,
                        code_challenge_method,
                        code_challenge,
                    },
                });

                return this.http
                    .post<SessionUser>(callback, credentials, { params: queryParams })
                    .pipe(map(user => this.setUser(user)));
            }),
        );
    }

    /**
     * Logs out the current user by sending a POST request to the '/auth/logout' endpoint.
     * Upon successful completion, resets the internal user state to null,
     * indicating that no user is authenticated.
     * @returns An observable that completes once the logout process and user state update are finished.
     */
    public logout(): Observable<void> {
        if (!this.isAuthenticated()) {
            return of(void 0);
        }

        return this.http.post('/auth/logout', null, { responseType: 'text' }).pipe(
            map(() => this.setUser(null)),
            tap(() => this.window.location.assign('/auth/login')),
        );
    }

    /**
     * Registers a new user.
     * @param profile The profile of the new user.
     */
    public createAccount(profile?: UserProfile): Observable<void> {
        return this.http.post('/auth/accounts', profile, { responseType: 'text' }).pipe(map(() => void 0));
    }

    /**
     * Updates the profile of the current user.
     * @param profile The updated user profile.
     */
    public updateAccount(profile: UserProfile): Observable<void> {
        return this.http.patch<SessionUser>('/auth/accounts', profile).pipe(map(user => this.setUser(user)));
    }

    /**
     * Deletes the account of the current authenticated user.
     */
    public deleteAccount(): Observable<void> {
        return this.http.delete('/auth/accounts', { responseType: 'text' }).pipe(map(() => this.setUser(null)));
    }

    /**
     * Determines whether the current user is authorized for the specified roles.
     * @param requiredRole The expected role, the current user must have.
     */
    public isAuthorized(requiredRole: UserRole | undefined): boolean {
        return isUserAuthorized(this.role(), requiredRole);
    }

    /**
     * Updates the endpoint authentication of the current user.
     * @param items The endpoint authentication items to update.
     * @returns An observable that completes when the update operation is successful.
     */
    public updateEndpointAuth(items: AASEndpointAuth[]): Observable<void> {
        return this.http.patch('/api/v1/endpoints/auth', items, { responseType: 'text' }).pipe(map(() => void 0));
    }

    private setUser(user: SessionUser | null): void {
        this._user.set(user);
        this.cache.clear();
    }
}
