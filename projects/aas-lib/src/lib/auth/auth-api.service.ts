/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Credentials, UserProfile, Cookie, AuthResult } from 'aas-core';
import { encodeBase64Url } from '../utilities';

@Injectable({
    providedIn: 'root',
})
export class AuthApiService {
    public constructor(private readonly http: HttpClient) {}

    public register(profile: UserProfile): Observable<AuthResult> {
        return this.http.post<AuthResult>('/api/v1/register', profile);
    }

    public guest(): Observable<AuthResult> {
        return this.http.post<AuthResult>('/api/v1/guest', undefined);
    }

    public login(credentials: Credentials): Observable<AuthResult> {
        return this.http.post<AuthResult>('/api/v1/login', credentials);
    }

    public getProfile(id: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`/api/v1/users/${encodeBase64Url(id)}`);
    }

    public updateProfile(id: string, profile: UserProfile): Observable<AuthResult> {
        return this.http.put<AuthResult>(`/api/v1/users/${encodeBase64Url(id)}`, profile);
    }

    public delete(id: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/users/${encodeBase64Url(id)}`);
    }

    public resetPassword(id: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/users/${encodeBase64Url(id)}/reset`);
    }

    public getCookies(id: string): Observable<Cookie[]> {
        return this.http.get<Cookie[]>(`/api/v1/users/${encodeBase64Url(id)}/cookies`);
    }

    public getCookie(id: string, name: string): Observable<Cookie | undefined> {
        return this.http.get<Cookie>(`/api/v1/users/${encodeBase64Url(id)}/cookies/${name}`);
    }

    public setCookie(id: string, cookie: Cookie): Observable<void> {
        return this.http.post<void>(`/api/v1/users/${encodeBase64Url(id)}/cookies/${cookie.name}`, cookie);
    }

    public deleteCookie(id: string, name: string): Observable<void> {
        return this.http.delete<void>(`/api/v1/users/${encodeBase64Url(id)}/cookies/${name}`);
    }
}
