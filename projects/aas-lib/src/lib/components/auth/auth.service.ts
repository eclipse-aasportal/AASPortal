/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, Observable, of, switchMap, take, throwError } from 'rxjs';
import { UserProfile, UserRole, User, Credentials } from 'aas-core';
import { encodeBase64Url } from '../../utilities';
import { HttpCache } from '../../services/http-cache';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly cache = inject(HttpCache);
    private readonly activeRoute = inject(ActivatedRoute);
    private readonly user$ = signal<User | null | undefined>(undefined);

    public constructor() {
        this.http.get<User | null>('/api/me').subscribe({
            next: user => {
                this.user$.set(user);
                this.cache.clear();
            },
            error: error => {
                this.user$.set(null);
                this.cache.clear();
                console.error(error);
            },
        });
    }

    /** Signals that an authentication was performed. */
    public readonly ready = toObservable(computed(() => this.user$() !== undefined));

    /** The e-mail of the current user. */
    public readonly email = computed(() => this.user$()?.id);

    /** The name or alias of the current user. */
    public readonly name = computed(() => this.user$()?.name);

    /** The current user role. */
    public readonly role = computed(() => this.user$()?.role);

    /** Indicates whether the current user is authenticated. */
    public readonly isAuthenticated = computed(() => this.user$() != null);

    /** The current active user. */
    public readonly user = this.user$.asReadonly();

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
     * Sends a POST request to the '/api/login' endpoint with the credentials,
     * receives the authenticated User object, and updates the internal user state.
     * @param credentials The credentials object containing the login information.
     * @returns An observable that completes once the user state is updated.
     */
    public login(credentials: Credentials): Observable<void> {
        return this.activeRoute.queryParamMap.pipe(
            take(1),
            switchMap(params => {
                const callback = params.get('redirect_uri');
                if (!callback) {
                    return throwError(() => new Error('Missing redirect URI in query parameters'));
                }

                const queryParams = new HttpParams({
                    fromObject: {
                        client_id: params.get('client_id')!,
                        state: params.get('state')!,
                        code_challenge_method: params.get('code_challenge_method')!,
                        code_challenge: params.get('code_challenge')!,
                    },
                });

                return this.http.post<User>(callback, credentials, { params: queryParams });
            }),
            map(user => this.user$.set(user)),
        );
    }

    /**
     * Logs out the current user by sending a POST request to the '/api/logout' endpoint.
     * Upon successful completion, resets the internal user state to null,
     * indicating that no user is authenticated.
     * @returns An observable that completes once the logout process and user state update are finished.
     */
    public logout(): Observable<void> {
        return this.http.post('/api/logout', null, { responseType: 'text' }).pipe(map(() => this.user$.set(null)));
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
        return this.http.patch<User>('/api/accounts', profile).pipe(map(user => this.user$.set(user)));
    }

    /**
     * Deletes the account of the current authenticated user.
     */
    public deleteAccount(): Observable<void> {
        return this.http
            .delete(`/api/accounts/${encodeBase64Url(this.email() ?? '')}`, { responseType: 'text' })
            .pipe(map(() => this.user$.set(null)));
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
}
