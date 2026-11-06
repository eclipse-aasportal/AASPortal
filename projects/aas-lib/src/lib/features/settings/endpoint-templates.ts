/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointType } from 'aas-core';

export interface EndpointTemplate {
    type: AASEndpointType;
    value: string;
    placeholder: string;
}

export const templates: EndpointTemplate[] = [
    {
        type: 'AAS_API',
        value: '',
        placeholder: 'AddEndpointForm.PLACEHOLDER_URL_HTTP',
    },
    {
        type: 'OPC_UA',
        value: '',
        placeholder: 'AddEndpointForm.PLACEHOLDER_URL_OPCUA',
    },
    {
        type: 'WebDAV',
        value: '',
        placeholder: 'AddEndpointForm.PLACEHOLDER_URL_WEBDAV',
    },
    {
        type: 'FileSystem',
        value: '',
        placeholder: 'AddEndpointForm.PLACEHOLDER_URL_FILE',
    },
];
