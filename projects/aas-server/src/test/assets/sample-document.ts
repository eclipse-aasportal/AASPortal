/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'common'

export const sampleDocument: AASDocument = {
    id: 'http://customer.com/aas/42',
    idShort: 'ExampleMotor',
    container: 'file:///samples?name=Samples',
    endpoint: {
        type: 'file',
        address: 'ExampleMotor.aasx'
    },
    timeStamp: 1656866284429,
    modified: false,
    readonly: false,
    onlineReady: false,
    content: null
};