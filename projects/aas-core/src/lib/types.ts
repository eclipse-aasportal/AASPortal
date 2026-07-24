/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as z from 'zod';
import * as aas from './aas.js';

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

export type AASEndpointScheduleType = 'disabled' | 'manual' | 'once' | 'every';

/** The schedule type. */
export const AASEndpointScheduleSchema = z.object({
    type: z.literal(['disabled', 'manual', 'once', 'every']),
    values: z.array(z.string().or(z.number())).optional(),
});

export interface AASEndpointSchedule {
    type: AASEndpointScheduleType;
    values?: (string | number)[];
}

/** The kind of AAS container or server. */
export type AASEndpointType = 'FileSystem' | 'AAS_API' | 'OPC_UA' | 'WebDAV';

/** Represents an AAS endpoint. */
export const AASEndpointSchema = z.object({
    headers: z.record(z.string(), z.string()).optional(),
    name: z.string().min(1),
    schedule: AASEndpointScheduleSchema.optional(),
    type: z.literal(['FileSystem', 'AAS_API', 'OPC_UA', 'WebDAV']),
    url: z.url(),
    version: z.string().optional(),
});

export interface AASEndpoint {
    name: string;
    headers?: Record<string, string>;
    schedule?: AASEndpointSchedule;
    type: AASEndpointType;
    url: string;
    version?: string;
}

/** The index update status.  */
export type UpdateIndexStatus = {
    name: string;
} & (
    | {
          status: 'idle';
      }
    | {
          status: 'scanning';
          start: number;
      }
);

/** Authentication of a user for an AAS endpoint. */
export interface EndpointAuth {
    name: string;
    headers: Record<string, string>;
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
    /** Indicates whether the document can be edited. */
    readonly: boolean;
    /** A thumbnail. */
    thumbnail?: string | null;
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
    name: string;
    url: string;
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

/** Defines an error message. */
export type ErrorData = {
    name: string;
    message: string;
    status: number;
    args?: Record<string, unknown>;
};

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
export const CookieSchema = z.object({
    name: z.string().min(1),
    data: z.string(),
});

export type Cookie = {
    name: string;
    data: string;
};

/** The Websocket data. */
export interface WebSocketData {
    /** The message type. */
    type: string;
    /** The data. */
    data: unknown;
}

/** Server message. */
export type AASNodeMessage =
    | {
          type: 'Cleared';
          endpoint?: string;
      }
    | {
          type: 'Added' | 'Removed' | 'Updated';
          start: number;
          document: AASDocument;
      }
    | {
          type: 'EndpointAdded' | 'EndpointRemoved' | 'EndpointUpdate';
          endpoint: AASEndpoint;
      }
    | {
          type: 'Start' | 'End';
          start: number;
          endpoint: string;
      };

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
 * Represents an application-level error.
 */
export class ApplicationError extends Error {
    /**
     * Constructs a new ApplicationError instance.
     *
     * Initializes the error with a specific message, optional arguments for additional error context,
     * and an optional status code (defaults to 500 if not provided). Sets the error name to the message.
     *
     * @param message - Describes the nature of the error.
     * @param args - Optional contextual data related to the error message.
     * @param statusCode - Optional HTTP or application status code associated with the error. Defaults to 500.
     */
    public constructor(
        message: string,
        public readonly args?: Record<string, unknown>,
        public readonly statusCode = 500,
    ) {
        super(message);
    }

    /**
     * Converts the ApplicationError instance into an ErrorData object.
     *
     * This method serializes the error details, including the error name, message, and status code,
     * into an object conforming to the ErrorData interface. This format is suitable for transmitting
     * error information to clients or external systems in a standardized way.
     *
     * @returns {ErrorData} The serialized error containing name, message, and status code.
     */
    public toJson(): ErrorData {
        const data: ErrorData = { name: this.name, message: this.stack ?? this.message, status: this.statusCode };
        if (this.args) {
            data.args = this.args;
        }

        return data;
    }
}

/** A package descriptor. */
export type PackageDescription = {
    /** The AAS Ids contained in the package. */
    aasIds?: string[];
    /** The unique package identifier. */
    packageId: string;
};
