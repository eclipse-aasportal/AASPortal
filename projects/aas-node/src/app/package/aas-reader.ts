/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';

/** Represents a reader of an Asset Administration Shell. */
export abstract class AASReader {
    public abstract readEnvironment(): aas.Environment;

    public abstract read(data: string | object): aas.Referable;

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

    protected createReference(parent: aas.Reference, child: aas.Referable): aas.Reference {
        return {
            type: 'ModelReference',
            keys: [
                ...parent.keys.map(key => ({ ...key })),
                {
                    type: child.modelType as aas.KeyTypes,
                    value: child.idShort,
                },
            ],
        };
    }
}
