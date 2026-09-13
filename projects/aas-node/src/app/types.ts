/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointAuth, SessionUser, UserRole } from 'aas-core';

/** Extend Express Request type to include 'user' */
declare module 'express-serve-static-core' {
    interface Request {
        user?: SessionUser;
    }
}

declare module 'express-session' {
    interface SessionData {
        user_id: string;
        name: string;
        role: UserRole;
        access_token: string;
        refresh_token: string;
        expires_at: number;
        code_verifier: string;
        endpoints: AASEndpointAuth[];
        state: string;
    }
}


export type EventListener = (...args: unknown[]) => void;
