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

/**
 * Interface for the user rights store.
 */
export interface UserRightsStore {
    /**
     * Returns the role of the specified user.
     * @param userId The ID of the user whose role is to be retrieved.
     */
    getRole(userId: string): Promise<UserRole>;

    /**
     * Returns the endpoints the specified user has access to.
     * @param userId The ID of the user whose accessible endpoints are to be retrieved.
     */
    getEndpoints(userId: string): Promise<AASEndpointAuth[]>;

    /** Adds the rights for the specified user.
     * @param userId The ID of the user whose rights are to be added.
     * @param rights The rights to be applied to the user.
     */
    add(userId: string, rights: Rights): Promise<void>;

    /** Updates the rights for the specified user.
     * @param userId The ID of the user whose rights are to be updated.
     * @param rights The new rights to be applied to the user.
     */
    update(userId: string, rights: Partial<Rights>): Promise<void>;

    /**
     * Deletes the rights for the specified user.
     * @param userId The ID of the user whose rights are to be deleted.
     */
    delete(userId: string): Promise<void>;
}
