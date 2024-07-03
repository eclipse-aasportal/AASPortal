/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PackageInfo, Message } from 'aas-core';
import { Observable } from 'rxjs';

/** Realizes the IServer service. */
@Injectable({
    providedIn: 'root',
})
export class ServerApiService {
    public constructor(private readonly http: HttpClient) {}

    public getInfo(): Observable<PackageInfo> {
        return this.http.get<PackageInfo>('/api/v1/app/info');
    }

    public getMessages(): Observable<Message[]> {
        return this.http.get<Message[]>('/api/v1/app/messages');
    }
}
