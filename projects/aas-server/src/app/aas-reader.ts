/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';

/** Represents an Asset Administration Shell reader. */
export abstract class AASReader {
    public abstract readEnvironment(): aas.Environment;

    protected createIdShort(id: string): string {
        if (id.startsWith('http')) {
            return id.split('/')[0];
        } else if (id.startsWith('urn:')) {
            return id.split(':')[0];
        }

        return id;
    }

    protected normalize(path: string): string {
        path = path.replace(/\\/g, '/');
        if (path.charAt(0) === '/') {
            path = path.slice(1);
        } else if (path.startsWith('./')) {
            path = path.slice(2);
        }

        return path;
    }
}
