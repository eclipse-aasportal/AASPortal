/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { RowDataPacket } from 'mysql2/promise';
import { AASEndpoint, AASDocument } from 'aas-core';

export interface MySqlEndpoint extends AASEndpoint, RowDataPacket {}

export interface MySqlDocument extends AASDocument, RowDataPacket {
    uuid: string;
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
    count: number;
}
