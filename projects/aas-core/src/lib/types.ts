/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aas from './aas.js';

/** Defines the supported endpoint types. */
export type EndpointType = 'file' | 'http' | 'opc';

/** Represents an endpoint of an AAS resource. */
export interface Endpoint {
    address: string;
    type: EndpointType;
}

/** Abbreviations for AAS model elements. */
export type AASAbbreviation =
    | 'AAS'
    | 'Cap'
    | 'CD'
    | 'DE'
    | 'DST'
    | 'Ent'
    | 'Evt'
    | 'InOut'
    | 'In'
    | 'Id'
    | 'MLP'
    | 'File'
    | 'Blob'
    | 'Opr'
    | 'Out'
    | 'Qfr'
    | 'Prop'
    | 'Range'
    | 'Ref'
    | 'Rel'
    | 'RelA'
    | 'SM'
    | 'SMC'
    | 'SME'
    | 'SML';

export type AASEndpointScheduleType = 'disabled' | 'manual' | 'once' | 'every' | 'daily' | 'weekly';

/** The schedule type. */
export interface AASEndpointSchedule {
    type: AASEndpointScheduleType;
    values?: (string | number)[];
}

/** The kind of AAS container or server. */
export type AASEndpointType = 'FileSystem' | 'AAS_API' | 'OPC_UA' | 'WebDAV';

/** The endpoint to an AAS container */
export interface AASEndpoint {
    name: string;
    url: string;
    type: AASEndpointType;
    schedule?: AASEndpointSchedule;
    version?: string;
    headers?: Record<string, string>;
}

/** The unique identifier of an AAS. */
export interface AASDocumentId {
    /** The identification of the Asset Administration Shell. */
    id: string;
    /** The name of the endpoint. */
    endpoint: string;
}

/** Represents an Asset Administration Shell */
export interface AASDocument extends AASDocumentId {
    /** The address of the AAS in the endpoint. */
    address: string;
    /** The document content of type `Environment`, `null` if the content is not loaded or
     * `undefined` if the content is not available. */
    content?: aas.Environment | null;
    /** Checksum to detect changes. */
    crc32: number;
    /** The name of the AAS. */
    idShort: string;
    /** The Asset identifier */
    assetId?: string;
    /** Indicates whether the document is modified. */
    modified?: boolean;
    /** Indicates whether communication can be established with the system represented by the AAS. */
    onlineReady?: boolean;
    /** The identifier of the parent AAS in a hierarchy. */
    parentId?: string | null;
    /** Indicates whether the document can be edited. */
    readonly: boolean;
    /** A thumbnail. */
    thumbnail?: string;
    /** The time at which the document was created. */
    timestamp: number;
}

/** Represents a page of AAS documents from the total set. */
export interface AASPagedResult {
    previous: AASDocumentId | null;
    next: AASDocumentId | null;
    documents: AASDocument[];
}

/** Represents a cursor in the collection of Asset Administration Shells. */
export interface AASCursor {
    previous?: AASDocumentId | null;
    limit: number;
    next?: AASDocumentId | null;
}

/** Describes a template. */
export interface TemplateDescriptor {
    idShort: string;
    id?: string;
    endpoint?: Endpoint;
    format?: '.json' | '.xml' | '.aasx';
    modelType: aas.ModelType | '';
}

export interface LiveValue {
    nodeId: string;
    value?: unknown;
    timeStamp?: number;
}

export interface LiveNode {
    nodeId: string;
    value?: unknown;
    valueType: aas.DataTypeDefXsd;
    timeStamp?: number;
}

export interface LiveRequest {
    endpoint: string;
    id: string;
    nodes: LiveNode[];
}

/** Provides information about the current application. */
export interface AppInfo {
    name: string;
    version: string;
    author: string;
    description: string;
    license: string;
    homepage: string;
    libraries: Library[];
}

/** Provides information about a 3rd-party package. */
export interface Library {
    name: string;
    version: string;
    description: string;
    license: string;
    licenseText: string;
    homepage?: string;
}

export interface DirEntry {
    type: 'file' | 'dir';
    name: string;
    dir: string;
    size: number;
    mtime: Date;
    url: string | null;
}

/**  */
export interface ErrorData {
    type: string;
    name: string;
    message: string;
    args?: Record<string, string | number | boolean | undefined>;
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
    data: unknown;
}

/** Defines the message types. */
export type AASNodeMessageType =
    | 'Added'
    | 'Removed'
    | 'Update'
    | 'Offline'
    | 'EndpointAdded'
    | 'EndpointRemoved'
    | 'Reset';

/** Server message. */
export type AASNodeMessage = {
    /** The type of change. */
    type: AASNodeMessageType;
} & (
    | {
          type: 'Reset';
      }
    | {
          type: 'Added' | 'Removed' | 'Update' | 'Offline';
          document: AASDocument;
      }
    | {
          type: 'EndpointAdded' | 'EndpointRemoved';
          endpoint: AASEndpoint;
      }
);

/**
 * Additional information for the client to, e.g. fetch the next part of the result set.
 */
export interface PagingMetadata {
    /**
     * The cursor for the next part of the result set. No cursor attribute means that the end of
     * the result set has been reached.
     */
    cursor?: string;
}

/**
 * An object connecting the actual list of returned items with metadata information to,
 * e.g. fetch the next part of the result set.
 */
export interface PagedResult<T> {
    /**
     * List of returned items.
     */
    result: T[];
    /**
     * Additional information for the client to, e.g. fetch the next part of the result set.
     */
    paging_metadata: PagingMetadata;
}

/**
 * Represents an application-level error with an associated name, optional HTTP status code,
 * and optional contextual arguments. Extends the built-in Error to preserve stack traces
 * and standard error behavior while carrying additional metadata for error handling and responses.
 *
 * @param name - The error name/message that describes the error.
 * @param args - Optional error message arguments (string|number|boolean).
 * @param statusCode - Optional numeric status code (e.g. HTTP status). Defaults to 500.
 */
export class ApplicationError extends Error {
    public constructor(
        name: string,
        public readonly args?: Record<string, string | number | boolean | undefined>,
        public readonly statusCode = 500,
    ) {
        super(name);

        this.name = name;
    }
}
