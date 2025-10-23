/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<<< HEAD:projects/aas-package/src/lib/types.ts
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
========
export const INFO = {
    FILE_SUCCESSFULLY_UPLOADED: 'Info.FILE_SUCCESSFULLY_UPLOADED',
};
>>>>>>>> refactor/download:projects/aas-portal/src/app/messages.ts
