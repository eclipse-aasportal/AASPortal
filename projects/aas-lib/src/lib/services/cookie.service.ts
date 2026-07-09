/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, mergeMap, Observable, of } from 'rxjs';

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
        return this.auth.isAuthenticated()
            ? this.http.get<string>(`/api/v1/cookies/${name}`).pipe(
                  mergeMap(value => of(value ?? undefined)),
                  catchError(error => {
                      console.error(`Failed to get cookie "${name}": ${error.message}`);
                      return of(undefined);
                  }),
              )
            : of(this.window.localStorage.getItem(name) ?? undefined);
    }

    /**
     * Sets the value of the cookie with the specified name.
     * @param name The cookie name.
     * @param data The cookie value.
     */
    public setCookie(name: string, data: string): Observable<void> {
        return this.auth.isAuthenticated()
            ? this.http
                  .post(`/api/v1/cookies/${name}`, data, {
                      headers: new HttpHeaders({ 'Content-Type': 'text/plain' }),
                      responseType: 'text',
                  })
                  .pipe(
                      mergeMap(() => of(void 0)),
                      catchError(error => {
                          console.error(`Failed to set cookie "${name}": ${error.message}`);
                          return of(void 0);
                      }),
                  )
            : of(this.window.localStorage.setItem(name, data));
    }

    /**
     * Deletes the cookie with the specified name.
     * @param name The cookie name.
     */
    public deleteCookie(name: string): Observable<void> {
        return this.auth.isAuthenticated()
            ? this.http.delete(`/api/v1/cookies/${name}`).pipe(
                  mergeMap(() => of(void 0)),
                  catchError(error => {
                      console.error(`Failed to delete cookie "${name}": ${error.message}`);
                      return of(void 0);
                  }),
              )
            : of(this.window.localStorage.removeItem(name));
    }
}
