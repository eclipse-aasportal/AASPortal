/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer, AASDocument, AASEndpoint } from './types.js';

/** Defines the message types. */
export type AASServerMessageType =
    | 'Added'
    | 'Removed'
    | 'Changed'
    | 'Offline'
    | 'ContainerAdded'
    | 'ContainerRemoved'
    | 'EndpointAdded'
    | 'EndpointRemoved'
    | 'Reset';

/** Server message. */
export interface AASServerMessage {
    /** The type of change. */
    type: AASServerMessageType;
    /** The container if type `ContainerAdded` and `ContainerRemoved`. */
    container?: AASContainer;
    /** The endpoint if type `ContainerAdded`, `ContainerRemoved`, `EndpointAdded`, `EndpointRemoved`. */
    endpoint?: AASEndpoint;
    /** The document if type `Added`, `Removed` or `Changed` */
    document?: AASDocument;
}
