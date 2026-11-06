/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from 'tsyringe';
import { AASEndpointAuth, UserRole } from 'aas-core';

export const USER_RIGHTS_STORE: InjectionToken<UserRightsStore> = Symbol('USER_RIGHTS_STORE');

export interface Rights {
    role: UserRole;
    endpoints: AASEndpointAuth[];
}

export interface UserRights extends Rights {
    id: string;
}

export abstract class UserRightsStore {
    public abstract getRole(userId: string): Promise<UserRole>;

    public abstract getEndpoints(userId: string): Promise<AASEndpointAuth[]>;

    public abstract add(userId: string, rights: Rights): Promise<void>;

    public abstract update(userId: string, rights: Partial<Rights>): Promise<void>;

    public abstract delete(userId: string): Promise<void>;
}
