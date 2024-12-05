/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { aas } from 'aas-core';
import { Logger } from '../../../app/logging/logger.js';
import { AASApiClient } from '../../../app/packages/aas-server/aas-api-client.js';
import { AASServerPackage } from '../../../app/packages/aas-server/aas-server-package.js';
import { createSpyObj } from 'fhg-jest';

describe('AasxServerPackage', () => {
    let aasPackage: AASServerPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<AASApiClient>;
    let env: aas.Environment;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = createSpyObj<AASApiClient>(['readEnvironmentAsync'], {
            endpoint: { name: 'Test', type: 'AAS_API', url: 'http:/localhost:1234' },
        });

        aasPackage = new AASServerPackage(logger, server, 'http://aas/CunaCup_Becher1', 'CunaCup_Becher1');
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
        server.readEnvironmentAsync.mockResolvedValue(env);
        await expect(aasPackage.createDocumentAsync()).resolves.toBeTruthy();
    });
});
