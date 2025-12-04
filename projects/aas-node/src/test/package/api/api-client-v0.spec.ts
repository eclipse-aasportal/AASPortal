/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, afterEach, Mocked, vitest } from 'vitest';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { aas, selectElement } from 'aas-core';
import { ApiClient } from '../../../app/client/api/api-client.js';
import listaas from '../../assets/test-aas/listaas.js';
import becher1 from '../../assets/test-aas/cuna-cup-becher1.js';
import submodels from '../../assets/test-aas/submodels.js';
import nameplate from '../../assets/test-aas/nameplate-becher1.js';
import digitalProductPassport from '../../assets/test-aas/digital-product-passport-becher1.js';
import customerFeedback from '../../assets/test-aas/customer-feedback-becher1.js';
import { ApiClientV0 } from '../../../app/client/api/api-client-v0.js';
import { Logger } from '../../../app/logging/logger.js';
import { aasEnvironment } from '../../assets/aas-environment.js';
import { createSpyObj } from '../../mocks.js';
import { HttpClient } from '../../../app/http-client.js';

describe('ApiClientV0', function () {
    let logger: Mocked<Logger>;
    let client: ApiClient;
    let http: Mocked<HttpClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        http = createSpyObj<HttpClient>(['get', 'getResponse']);
        client = new ApiClientV0(logger, http, {
            name: 'AASX Server',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    describe('getShells', () => {
        it('returns the AAS list', async () => {
            http.get.mockResolvedValue(listaas);
            const result = await client.getShells();
            expect(result.result).toEqual([
                'AssistanceSystem_Dte',
                'CunaCup_Becher1',
                'CunaCup_Becher2',
                'DTOrchestrator',
            ]);
        });
    });

    describe('getEnvironment', () => {
        it('gets the AAS with the specified idShort', async () => {
            http.get.mockImplementation(url => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let value: any;
                switch (url.pathname) {
                    case '/aas/CunaCup_Becher1/submodels':
                        value = submodels;
                        break;
                    case '/aas/CunaCup_Becher1/submodels/Nameplate_Becher1/complete':
                        value = nameplate;
                        break;
                    case '/aas/CunaCup_Becher1/submodels/DigitalProductPassport_Becher1/complete':
                        value = digitalProductPassport;
                        break;
                    case '/aas/CunaCup_Becher1/submodels/CustomerFeedback_Becher1/complete':
                        value = customerFeedback;
                        break;
                    default:
                        value = becher1;
                        break;
                }

                return new Promise(resolve => resolve(value));
            });

            await expect(client.getEnvironment('CunaCup_Becher1')).resolves.toBeTruthy();
        });
    });

    describe('openRead', () => {
        it('can open a file', async () => {
            const stream = new IncomingMessage(new Socket());
            stream.push(
                JSON.stringify({
                    aaslist: ['0 : ExampleMotor : [IRI] http://customer.com/aas/9175_7013_7091_9168 : '],
                }),
            );

            stream.push(null);
            stream.statusCode = 200;
            stream.statusMessage = 'OK';

            http.get.mockResolvedValue({
                aaslist: ['0 : ExampleMotor : [IRI] http://customer.com/aas/9175_7013_7091_9168 : '],
            });

            http.getResponse.mockResolvedValue(stream);
            await expect(
                client.openRead(
                    aasEnvironment.assetAdministrationShells[0].idShort,
                    selectElement(aasEnvironment, 'Documentation', 'OperatingManual.DigitalFile_PDF')!,
                ),
            ).resolves.toBeTruthy();
        });
    });

    describe('readValue', () => {
        it('reads the current value of a data element', async () => {
            http.get.mockResolvedValue({ value: '42' });
            await expect(client.readValue('http://localhost:1234', 'xs:int')).resolves.toBe(42);
        });
    });

    describe('resolveNodeId', function () {
        let shell: Mocked<aas.AssetAdministrationShell>;

        beforeEach(function () {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { idShort: 'aas1' });
        });

        it('returns the URL to "property1"', function () {
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64url');
            const nodeId = smId + '#property1';
            expect(client.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/aas/aas1/submodels/${smId}/elements/property1/value`,
            );
        });
    });
});
