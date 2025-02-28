/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { RowDataPacket } from 'mysql2/promise';
import { AASEndpointType } from 'aas-core';

export interface MySqlEndpoint extends RowDataPacket {
    name: string;
    url: string;
    type: AASEndpointType;
    version: string | null;
    headers: string | null;
    schedule: string | null;
}

export interface MySqlDocument extends RowDataPacket {
    uuid: string;
    address: string;
    crc32: number;
    idShort: string;
    assetId: string | null;
    thumbnail: string | null;
    timestamp: number;
}

export interface MySqlElement extends RowDataPacket {
    uuid: string;
    modelType: string;
    id?: string;
    idShort: string;
    stringValue?: string;
    numberValue?: number;
    dateValue?: Date;
    booleanValue?: boolean;
}

export interface DocumentCount extends RowDataPacket {
    'COUNT(*)': number;
}
