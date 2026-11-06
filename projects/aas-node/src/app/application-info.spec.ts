/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect } from 'vitest';
import { AppInfo } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';

import { ApplicationInfo } from './application-info.js';
import { Variable } from './variable.js';
import { createSpyObj } from '../test/mocks.js';

const appInfo: AppInfo = {
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
    let applicationInfo: ApplicationInfo;

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(LOGGER, createSpyObj<Logger>(['error', 'warning', 'info']));
        container.registerInstance(Variable, createSpyObj<Variable>({}, { ASSETS: './' }));

        applicationInfo = container.resolve(ApplicationInfo);
        applicationInfo['data'] = appInfo as AppInfo;
    });

    it('gets the AASNode package info', async () => {
        await expect(applicationInfo.get()).resolves.toEqual(appInfo);
    });
});
