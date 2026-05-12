/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { Cookie } from 'aas-core';

import { WINDOW } from './window.service';
import { AuthService } from '../core/auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class CookieService {
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly window = inject(WINDOW);

    /**
     * Gets the value of the cookie with the specified name.
     * @param name The cookie name.
     * @returns The cookie value.
     */
    public getCookie(name: string): Observable<string | undefined> {
        if (this.auth.isAuthenticated()) {
            return this.http.get<Cookie>(`/api/v1/cookies/${name}`).pipe(
                map(cookie => cookie?.data),
                catchError(() => of(undefined)),
            );
        } else {
            return of(this.window.localStorage.getItem(name) ?? undefined);
        }
    }

    /**
     * Sets the value of the cookie with the specified name.
     * @param name The cookie name.
     * @param data The cookie value.
     */
    public setCookie(name: string, data: string): Observable<void> {
        if (this.auth.isAuthenticated()) {
            return this.http.post<void>(`/api/v1/cookies/${name}`, { name, data });
        } else {
            this.window.localStorage.setItem(name, data);
            return of(void 0);
        }
    }

    /**
     * Deletes the cookie with the specified name.
     * @param name The cookie name.
     */
    public deleteCookie(name: string): Observable<void> {
        if (this.auth.isAuthenticated()) {
            return this.http.delete<void>(`/api/v1/cookies/${name}`);
        } else {
            this.window.localStorage.removeItem(name);
            return of(void 0);
        }
    }
}
