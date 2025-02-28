/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { aas, selectElement } from 'aas-core';
import { AASApiClient } from '../../../app/package/aas-api/aas-api-client.js';
import listaas from '../../assets/test-aas/listaas.js';
import becher1 from '../../assets/test-aas/cuna-cup-becher1.js';
import submodels from '../../assets/test-aas/submodels.js';
import nameplate from '../../assets/test-aas/nameplate-becher1.js';
import digitalProductPassport from '../../assets/test-aas/digital-product-passport-becher1.js';
import customerFeedback from '../../assets/test-aas/customer-feedback-becher1.js';
import { AASApiClientV0 } from '../../../app/package/aas-api/aas-api-client-v0.js';
import { Logger } from '../../../app/logging/logger.js';
import aasEnvironment from '../../assets/aas-environment.js';
import { createSpyObj } from 'fhg-jest';
import { HttpClient } from '../../../app/http-client.js';

describe('AASApiClientV0', function () {
    let logger: jest.Mocked<Logger>;
    let client: AASApiClient;
    let http: jest.Mocked<HttpClient>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        http = createSpyObj<HttpClient>(['get', 'getResponse']);
        client = new AASApiClientV0(logger, http, {
            name: 'AASX Server',
            type: 'AAS_API',
            url: 'http://localhost:1234',
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getShellsAsync', () => {
        it('returns the AAS list', async () => {
            http.get.mockResolvedValue(listaas);
            const result = await client.getShells();
            expect(result.result).toEqual([
                {
                    id: 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:AAS:AssistanceSystem:Dte',
                    idShort: 'AssistanceSystem_Dte',
                },
                { id: 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:AAS:CunaCup:Becher1', idShort: 'CunaCup_Becher1' },
                { id: 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:AAS:CunaCup:Becher2', idShort: 'CunaCup_Becher2' },
                { id: 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:AAS:DTOrchestrator', idShort: 'DTOrchestrator' },
            ]);
        });
    });

    describe('readEnvironmentAsync', () => {
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

            await expect(
                client.readEnvironment({ id: 'http://aas/CunaCup_Becher1', idShort: 'CunaCup_Becher1' }),
            ).resolves.toBeTruthy();
        });
    });

    describe('openFileAsync', () => {
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
                client.openFile(
                    aasEnvironment.assetAdministrationShells[0],
                    selectElement(aasEnvironment, 'Documentation', 'OperatingManual', 'DigitalFile_PDF')!,
                ),
            ).resolves.toBeTruthy();
        });
    });

    describe('readValueAsync', () => {
        it('reads the current value of a data element', async () => {
            http.get.mockResolvedValue({ value: '42' });
            await expect(client.readValue('http://localhost:1234', 'xs:int')).resolves.toBe(42);
        });
    });

    describe('resolveNodeId', function () {
        let shell: jest.Mocked<aas.AssetAdministrationShell>;

        beforeEach(function () {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { idShort: 'aas1' });
        });

        it('returns the URL to "property1"', function () {
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64');
            const nodeId = smId + '.submodel1/property1';
            expect(client.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/aas/aas1/submodels/submodel1/elements/property1/value`,
            );
        });
    });
});