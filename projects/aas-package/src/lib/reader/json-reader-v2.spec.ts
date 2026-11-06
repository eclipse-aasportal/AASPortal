/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile } from 'fs/promises';
import { JsonReaderV2 } from './json-reader-v2.js';
import { aas } from 'aas-core';
import * as aas_v2 from '../aas-v2.js';

describe('JsonReaderV2', () => {
    let json: object;
    let env_v2: aas_v2.AssetAdministrationShellEnvironment;

    beforeEach(async () => {
        const file = fileURLToPath(new URL('../../test/assets/aas-example-v2.json', import.meta.url));
        json = JSON.parse((await readFile(file)).toString());
        env_v2 = json as aas_v2.AssetAdministrationShellEnvironment;
    });

    it('should be created', () => {
        const reader = new JsonReaderV2(env_v2);
        expect(reader).toBeTruthy();
    });

    it('reads the AAS environment from a JSON source', () => {
        const reader = new JsonReaderV2(env_v2);
        const env = reader.readEnvironment();
        expect(env).toBeDefined();
    });

    it('reads a Referable from JSON', () => {
        const shell: aas.AssetAdministrationShell = new JsonReaderV2().read(
            env_v2.assetAdministrationShells[0],
        ) as aas.AssetAdministrationShell;

        expect(shell).toEqual(
            expect.objectContaining({
                id: env_v2.assetAdministrationShells[0].identification.id,
                idShort: env_v2.assetAdministrationShells[0].idShort,
            }),
        );
    });
});
