/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { aas } from 'aas-core';
import { Logger } from '../../../app/logging/logger.js';
import { ApiClient } from '../../../app/package/api/api-client.js';
import { ApiPackage } from '../../../app/package/api/api-package.js';
import { createSpyObj } from 'aas-jest';

describe('ApiPackage', () => {
    let aasPackage: ApiPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<ApiClient>;
    let env: aas.Environment;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        server = createSpyObj<ApiClient>(['readEnvironment'], {
            endpoint: { name: 'Test', type: 'AAS_API', url: 'http:/localhost:1234' },
        });

        aasPackage = new ApiPackage(logger, server, 'http://aas/CunaCup_Becher1', 'CunaCup_Becher1');
        env = {
            assetAdministrationShells: [
                {
                    id: 'Sample AAS',
                    idShort: 'http://www.fraunhofer.de/aas',
                    modelType: 'AssetAdministrationShell',
                    assetInformation: { assetKind: 'Instance' },
                },
            ],
            submodels: [],
            conceptDescriptions: [],
        };
    });

    it('creates a document', async () => {
        server.readEnvironment.mockResolvedValue(env);
        await expect(aasPackage.createDocument()).resolves.toBeTruthy();
    });
});
