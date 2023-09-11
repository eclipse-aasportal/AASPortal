/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aas from "./aas.js";

/** Defines the supported endpoint types. */
export type EndpointType = 'file' | 'http' | 'opc';

/** Represents an endpoint of a AAS resource. */
export interface Endpoint {
    address: string;
    type: EndpointType;
}

/** Abbreviations for AAS model elements. */
export type AASAbbreviation =
    'AAS' |
    'Cap' |
    'CD' |
    'DE' |
    'DST' |
    'Ent' |
    'Evt' |
    'InOut' |
    'In' |
    'Id' |
    'MLP' |
    'File' |
    'Blob' |
    'Opr' |
    'Out' |
    'Qfr' |
    'Prop' |
    'Range' |
    'Ref' |
    'Rel' |
    'RelA' |
    'SM' |
    'SMC' |
    'SME' |
    'SML' ;

/** Represents a server (AASX, OPC-UA) or file directory (AASX package files). */
export interface AASContainer {
    /** The URL of the container endpoint. */
    url: string;
    /** An alias for the container. */
    name: string;
    /** The AAS documents that this container provides. */
    documents?: AASDocument[];
}

/** Represents an Asset Administration Shell */
export interface AASDocument {
    /** The identification of the Asset Administration Shell. */
    id: string;
    /** The name of the AAS. */
    idShort: string;
    /** The address of the resource containing the AAS. */
    endpoint: Endpoint;
    /** The reference of the container from which the AAS comes. */
    container: string;
    /** A time stamp that represents the current state of the AAS. */
    timeStamp: number;
    /** Indicates whether the document can be edited. */
    readonly: boolean;
    /** Indicates whether the document is modified. */
    modified?: boolean;
    /** Indicates whether communication can be established with the system represented by the AAS. */
    onlineReady?: boolean;
    /** The root element of the AAS structure (content), `null` if the content is not loaded or 
     * `undefined` if the content is not available. */
    content?: aas.Environment | null;
}

/** Describes a template. */
export interface TemplateDescriptor {
    name: string;
    endpoint?: Endpoint;
    format?: '.json' | '.xml';
    template?: aas.Referable;
}

/** Represents a named source of Asset Administration Shells. */
export interface AASWorkspace {
    /** The configuration name. */
    name: string;
    /** The assigned containers */
    containers: AASContainer[];
}

export interface LiveValue {
    nodeId: string;
    value?: any;
    timeStamp?: number;
}

export interface LiveNode {
    nodeId: string;
    value?: any;
    valueType: aas.DataTypeDefXsd;
    timeStamp?: number;
}

export interface LiveRequest {
    type: EndpointType;
    url: string;
    id: string;
    nodes: LiveNode[]
}

/** The kind of AAS container or server. */
export type AASEndpointType = 'AasxDirectory' | 'AasxServer' | 'OpcuaServer' | 'AASRegistry';

export interface PackageInfo {
    name: string;
    version: string;
    author: string;
    description: string;
    license: string;
    homepage: string;
    libraries: Library[];
}

export type DirEntry = {
    type: 'file' | 'dir';
    name: string;
    dir: string;
    size: number;
    mtime: Date;
    url: string | null;
};

/**  */
export interface ErrorData {
    method: string;
    type: string;
    name: string;
    message: string;
    args: any[];
}

/** Provides information about a 3rd-party package. */
export interface Library {
    name: string;
    version?: string;
    description?: string;
    license?: string;
    homepage?: string;
}

/** Defines the message types. */
export type MessageType = 'Error' | 'Warning' | 'Info';

/** Represents a AAS-Server message. */
export interface Message {
    /** The message type. */
    type: MessageType;
    /** The time when the message occurred. */
    timestamp: number;
    /** The message. */
    text: string;
}

/** Represents a cookie. */
export interface Cookie {
    name: string;
    data: string;
}

/** The Websocket data. */
export interface WebSocketData {
    /** The message type. */
    type: string;
    /** The data. */
    data: any;
}
