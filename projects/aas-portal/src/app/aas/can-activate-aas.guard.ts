/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AASQueryParams } from 'aas-lib';
import { AASStoreService } from './aas-store.service';

@Injectable()
export class CanActivateAAS {
    public constructor(private readonly store: AASStoreService) {}

    public canActivate(
        route: ActivatedRouteSnapshot,
    ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        const params: AASQueryParams = route.queryParams;
        if (params.id) {
            return true;
        }

        return this.store.document != null;
    }
}
