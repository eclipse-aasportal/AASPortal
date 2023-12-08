/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Environment } from 'projects/aas-lib/src/public-api';

export const environment: Environment = {
    production: false,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    version: (require('../../../../package.json') as { version: string }).version + '-dev',
    homepage: 'https://www.iosb-ina.fraunhofer.de/',
    author: 'Fraunhofer IOSB-INA',
};