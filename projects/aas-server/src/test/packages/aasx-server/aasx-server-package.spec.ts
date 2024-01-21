/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { aas } from 'common';
import { Logger } from '../../../app/logging/logger.js';
import { AasxServer } from '../../../app/packages/aasx-server/aasx-server.js';
import { AasxServerPackage } from '../../../app/packages/aasx-server/aasx-server-package.js';
import { createSpyObj } from '../../utils.js';

describe('AasxServerPackage', () => {
    let aasPackage: AasxServerPackage;
    let logger: jest.Mocked<Logger>;
    let server: jest.Mocked<AasxServer>;
    let env: aas.Environment;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = createSpyObj<AasxServer>(['readEnvironmentAsync'], {
            url: 'http:/localhost:1234',
            name: 'Test',
        });

        aasPackage = new AasxServerPackage(logger, server, 'CunaCup_Becher1');
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
