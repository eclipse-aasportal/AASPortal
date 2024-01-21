/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AASQueryParams } from 'projects/aas-lib/src/public-api';
import * as AASSelectors from './aas.selectors';
import { State } from './aas.state';

@Injectable()
export class CanActivateAAS {
    private readonly store: Store<State>;
    public constructor(store: Store) {
        this.store = store as Store<State>;
    }

    public canActivate(
        route: ActivatedRouteSnapshot,
    ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        const params: AASQueryParams = route.queryParams;
        if (params.id || params.format) {
            return true;
        }

        return this.store.select(AASSelectors.selectHasDocument);
    }
}