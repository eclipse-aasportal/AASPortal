/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { JWTPayload, noop } from 'aas-core';
import jwt from 'jsonwebtoken';

export const editorPayload: JWTPayload = { sub: 'john.doe@email.com', name: 'John', role: 'editor' };

export function getToken(name?: string): string {
    noop(name);
    return jwt.sign(editorPayload, 'SecretSecretSecretSecretSecretSecret');
}
