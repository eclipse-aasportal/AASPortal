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

import appInfo from '../assets/app-info.json' with { type: 'json ' };

describe('Application Info service', () => {
    let logger: jest.Mocked<Logger>;
    let variable: jest.Mocked<Variable>;
    let applicationInfo: ApplicationInfo;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        variable = createSpyObj<Variable>({}, { ASSETS: './' });
        applicationInfo = new ApplicationInfo(logger, variable, appInfo as AppInfo);
    });

    it('gets the AASServer package info', async () => {
        await expect(applicationInfo.getAsync()).resolves.toEqual(appInfo);
    });
});
