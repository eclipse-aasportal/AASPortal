/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { AppInfo } from 'aas-core';
import { createSpyObj } from 'fhg-jest';
import { ApplicationInfo } from '../app/application-info.js';
import { Logger } from '../app/logging/logger.js';
import { Variable } from '../app/variable.js';

const appInfo = {
    name: 'aas-portal-project',
    version: '2.0.0',
    description: 'Web-based visualization and control of asset administration shells.',
    author: 'Fraunhofer IOSB-INA e.V.',
    homepage: 'https://www.iosb-ina.fraunhofer.de/',
    license: 'Apache-2.0',
    libraries: [
        {
            name: 'Library',
            version: '1.0',
            description: 'A library.',
            license: 'MIT',
            licenseText: 'License text...',
            homepage: 'https://www.iosb-ina.fraunhofer.de/',
        },
    ],
};

describe('Application Info service', () => {
    let logger: jest.Mocked<Logger>;
    let variable: jest.Mocked<Variable>;
    let applicationInfo: ApplicationInfo;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        variable = createSpyObj<Variable>({}, { ASSETS: './' });
        applicationInfo = new ApplicationInfo(logger, variable, appInfo as AppInfo);
    });

    it('gets the AASNode package info', async () => {
        await expect(applicationInfo.getAsync()).resolves.toEqual(appInfo);
    });
});
