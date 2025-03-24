/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { UserRole } from 'aas-core';

/** The user data. */
export type UserData = {
    /** The e-mail address. */
    id: string;
    /** The name or alias. */
    name: string;
    /** The role. */
    role: UserRole;
    /** The password hash. */
    password: string;
    /** The creation date. */
    created: Date;
    /** The date and time of the last login. */
    lastLoggedIn: Date;
};
