/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Environment } from 'aas-lib';

export const environment: Environment = {
    production: false,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: (require('../../../../package.json') as { version: string }).version,
    homepage: 'https://www.iosb-ina.fraunhofer.de/',
    author: 'Fraunhofer IOSB-INA',
};