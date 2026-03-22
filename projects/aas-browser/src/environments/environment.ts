/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Environment } from '../app/types';
import data from '../../../../package.json';

export const environment: Environment = {
    production: true,
    version: data.version,
    homepage: 'https://www.iosb-ina.fraunhofer.de/',
    author: 'Fraunhofer IOSB-INA',
    basePath: '/api/v3/',
    port: '50010',
};
