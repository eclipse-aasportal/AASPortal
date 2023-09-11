/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, aas } from "common";
import { Logger } from "../logging/logger.js";

/**
 * Represents a package that contains an Asset Administration Shell.
 */
export abstract class AASPackage {
    protected readonly logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    /** Gets the document that contains an Asset Administration Shell. */
    public abstract createDocumentAsync(): Promise<AASDocument>;

    /** Gets the thumbnail of the current Asset Administration Shell */
    public abstract getThumbnailAsync(): Promise<NodeJS.ReadableStream>;

    /**
     * Returns a read-only stream of a file in a package with the specified path.
     * @param env The Asset Administration Shell Environment.
     * @param file The File element.
     * @returns A readable stream.
     */
    public abstract openReadStreamAsync(env: aas.Environment, file: aas.File): Promise<NodeJS.ReadableStream>;

    /**
     * Applies the state of the source document into the destination document.
     * @param source The source document.
     * @param content The new document content.
     */
    public abstract commitDocumentAsync(source: AASDocument, content: aas.Environment): Promise<string[]>;

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