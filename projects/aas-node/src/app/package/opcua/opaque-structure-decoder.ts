/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { BinaryStream, DataValueOptions } from 'node-opcua';
import { OpaqueStructure } from 'node-opcua-extension-object';
import { aas } from 'aas-core';
import { UAKeyElements } from './opcua.js';

export function decodeOpaqueStructure(value: OpaqueStructure, dataType: string): DataValueOptions {
    if (dataType === 'AASKeyDataType') {
        return {
            value: {
                arrayType: 'Array',
                dimensions: [1],
                value: decodeToKeyArray(value.buffer),
            },
        };
    }

    throw new Error('Invalid operation.');

    function decodeToKeyArray(buffer: Buffer): aas.Key[] {
        const keys: aas.Key[] = [];
        const stream = new BinaryStream(buffer);
        while (stream.length < stream.buffer.byteLength) {
            const type = stream.readUInt32() as UAKeyElements;
            const id = stream.readString() as string;
            keys.push({
                type: toKeyTypes(type),
                value: id,
            });
        }

        return keys;

        function toKeyTypes(value: UAKeyElements): aas.KeyTypes {
            return UAKeyElements[value] as aas.KeyTypes;
        }
    }
}
