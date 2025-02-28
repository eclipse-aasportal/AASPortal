/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASEndpoint } from './types.js';

/** Defines the message types. */
export type AASServerMessageType =
    | 'Added'
    | 'Removed'
    | 'Update'
    | 'Offline'
    | 'EndpointAdded'
    | 'EndpointRemoved'
    | 'Reset';

/** Server message. */
export interface AASServerMessage {
    /** The type of change. */
    type: AASServerMessageType;
    /** The endpoint if type `EndpointAdded`, `EndpointRemoved`. */
    endpoint?: AASEndpoint;
    /** The document if type `Added`, `Removed` or `Changed` */
    document?: AASDocument;
}
