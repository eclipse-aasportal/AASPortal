/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Credentials, UserProfile, Cookie, AuthResult } from 'common';
import { encodeBase64Url } from '../convert';

@Injectable({
    providedIn: 'root',
})
export class AuthApiService {
    constructor(
        private readonly http: HttpClient
    ) { }

    public registerUserAsync(profile: UserProfile): Promise<AuthResult> {
        return new Promise<AuthResult>((result, reject) => {
            let data: AuthResult;
            this.http.post<AuthResult>(
                '/api/v1/register',
                profile).subscribe(
                    {
                        next: (value) => data = value,
                        complete: () => result(data),
                        error: (error) => reject(error)
                    });
        });
    }

    public guestAsync(): Promise<AuthResult> {
        return new Promise<AuthResult>((result, reject) => {
            let data: AuthResult;
            this.http.post<AuthResult>(
                '/api/v1/guest', undefined).subscribe(
                    {
                        next: value => data = value,
                        complete: () => result(data),
                        error: (error) => reject(error)
                    });
        });
    }

    public loginAsync(credentials: Credentials): Promise<AuthResult> {
        return new Promise<AuthResult>((result, reject) => {
            let data: AuthResult;
            this.http.post<AuthResult>(
                '/api/v1/login',
                credentials).subscribe(
                    {
                        next: value => data = value,
                        complete: () => result(data),
                        error: (error) => reject(error)
                    });
        });
    }

    public updateProfileAsync(id: string, profile: UserProfile): Promise<AuthResult> {
        return new Promise<AuthResult>((result, reject) => {
            let data: AuthResult;
            this.http.put<AuthResult>(
                `/api/v1/users/${encodeBase64Url(id)}`,
                profile).subscribe(
                    {
                        next: (value) => data = value,
                        complete: () => result(data),
                        error: (error) => reject(error)
                    });
        });
    }

    public updateProfile(id: string, profile: UserProfile): Observable<AuthResult> {
        return this.http.put<AuthResult>(`/api/v1/users/${encodeBase64Url(id)}`, profile);
    }

    public deleteUserAsync(id: string): Promise<void> {
        return new Promise<void>((result, reject) => {
            this.http.delete<void>(
                `/api/v1/users/${encodeBase64Url(id)}`)
                .subscribe({
                    complete: () => result(),
                    error: (error) => reject(error)
                });
        });
    }

    public resetPasswordAsync(id: string): Promise<void> {
        return new Promise<void>((result, reject) => {
            this.http.delete<void>(
                `/api/v1/users/${encodeBase64Url(id)}/reset`)
                .subscribe({
                    complete: () => result(),
                    error: (error) => reject(error)
                });
        });
    }

    public getCookies(id: string): Observable<Cookie[]> {
        return this.http.get<Cookie[]>(`/api/v1/users/${encodeBase64Url(id)}/cookies`);
    }

    public setCookie(id: string, cookie: Cookie): Observable<void> {
        return this.http.post<void>(
            `/api/v1/users/${encodeBase64Url(id)}/cookies/${cookie.name}`,
            cookie);
    }

    public deleteCookie(id: string, name: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/users/${encodeBase64Url(id)}/cookies/${name}`);
    }
}