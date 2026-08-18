/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, computed, signal, DOCUMENT } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable, of, switchMap, take, throwError } from 'rxjs';
import { UserProfile, UserRole, User, Credentials, EndpointAuth } from 'aas-core';
import { DocumentCache } from '../../shared/services/document-cache';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly cache = inject(DocumentCache);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly document = inject(DOCUMENT);
    private readonly _user = signal<User | null | undefined>(undefined);

    public constructor() {
        this.http.get<User | null>('/api/me').subscribe({
            next: user => {
                this._user.set(user);
                this.cache.clear();
            },
            error: error => {
                this._user.set(null);
                this.cache.clear();
                console.error(error);
            },
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
     * @param roles The expected user roles.
     */
    public ensureAuthorized(...roles: UserRole[]): Observable<void> {
        if (this.isAuthorized(roles)) {
            return of(void 0);
        }

        return of(void 0);
    }

    /**
     * Performs user authentication using the provided credentials.
     * Sends a POST request to the '/api/login' endpoint with the credentials.
     * @param credentials The credentials object containing the login information.
     * @returns An observable that completes when the user is authenticated.
     */
    public login(credentials?: Credentials): Observable<void> {
        if (this.isAuthenticated()) {
            return of(void 0);
        }

        if (!credentials) {
            return of(this.document.location.assign('/api/login'));
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
                    .post<User>(callback, credentials, { params: queryParams })
                    .pipe(map(user => this._user.set(user)));
            }),
        );
    }

    /**
     * Logs out the current user by sending a POST request to the '/api/logout' endpoint.
     * Upon successful completion, resets the internal user state to null,
     * indicating that no user is authenticated.
     * @returns An observable that completes once the logout process and user state update are finished.
     */
    public logout(): Observable<void> {
        if (!this.isAuthenticated()) {
            return of(void 0);
        }

        return this.http.post('/api/logout', null, { responseType: 'text' }).pipe(map(() => this._user.set(null)));
    }

    /**
     * Registers a new user.
     * @param profile The profile of the new user.
     */
    public createAccount(profile?: UserProfile): Observable<void> {
        return this.http.post('/api/accounts', profile, { responseType: 'text' }).pipe(map(() => void 0));
    }

    /**
     * Updates the profile of the current user.
     * @param profile The updated user profile.
     */
    public updateAccount(profile: UserProfile): Observable<void> {
        return this.http.patch<User>('/api/accounts', profile).pipe(map(user => this._user.set(user)));
    }

    /**
     * Deletes the account of the current authenticated user.
     */
    public deleteAccount(): Observable<void> {
        return this.http.delete('/api/accounts', { responseType: 'text' }).pipe(map(() => this._user.set(null)));
    }

    /**
     * Determines whether the current user is authorized for the specified roles.
     * @param expected The expected role, the current user must have.
     */
    public isAuthorized(expected: UserRole[] | undefined): boolean {
        if (!expected) {
            return true;
        }

        const role = this.role();
        if (!role) {
            return false;
        }

        return expected.indexOf(role) >= 0;
    }

    /**
     * Updates the endpoint authentication of the current user.
     * @param items The endpoint authentication items to update.
     * @returns An observable that completes when the update operation is successful.
     */
    public updateEndpointAuth(items: EndpointAuth[]): Observable<void> {
        return this.http.patch('/api/v1/endpoints/auth', items, { responseType: 'text' }).pipe(map(() => void 0));
    }
}
