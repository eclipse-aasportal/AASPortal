/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type FileResult = {
    filename: string;
    value: string;
    readable: NodeJS.ReadableStream;
    size?: number;
    contentType?: string;
};

export interface HTMLDocumentElement extends HTMLElement {
    _nsMap: { [key: string]: string };
}
