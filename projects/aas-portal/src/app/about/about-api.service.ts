/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppInfo, Message } from 'aas-core';
import { Observable } from 'rxjs';

/** Realizes the IServer service. */
@Injectable({
    providedIn: 'root',
})
export class AboutApiService {
    public constructor(private readonly http: HttpClient) {}

    public getInfo(): Observable<AppInfo> {
        return this.http.get<AppInfo>('/api/v1/app/info');
    }

    public getMessages(): Observable<Message[]> {
        return this.http.get<Message[]>('/api/v1/app/messages');
    }
}
