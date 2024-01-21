/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, beforeEach, it, expect, jest, afterEach } from '@jest/globals';
import http, { IncomingMessage } from 'http';
import { Socket } from 'net';
import { aas, selectElement } from 'common';
import { AasxServer } from '../../../app/packages/aasx-server/aasx-server.js';
import listaas from '../../assets/test-aas/listaas.js';
import becher1 from '../../assets/test-aas/cuna-cup-becher1.js';
import submodels from '../../assets/test-aas/submodels.js';
import nameplate from '../../assets/test-aas/nameplate-becher1.js';
import digitalProductPassport from '../../assets/test-aas/digital-product-passport-becher1.js';
import customerFeedback from '../../assets/test-aas/customer-feedback-becher1.js';
import { AasxServerV0 } from '../../../app/packages/aasx-server/aasx-server-v0.js';
import { Logger } from '../../../app/logging/logger.js';
import aasEnvironment from '../../assets/aas-environment.js';
import { createSpyObj } from '../../utils.js';

describe('AasxServerV0', function () {
    let logger: jest.Mocked<Logger>;
    let server: AasxServer;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        server = new AasxServerV0(logger, 'http://localhost:1234', 'AASX Server');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns the AAS list', async function () {
        jest.spyOn(http, 'request').mockImplementation((options, callback) => {
            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify(listaas));
            stream.push(null);
            stream.statusCode = 200;
            stream.statusMessage = 'OK';
            (callback as (res: IncomingMessage) => void)(stream);
            return new http.ClientRequest('http://localhost:1234');
        });

        await expect(server.getShellsAsync()).resolves.toEqual([
            'AssistanceSystem_Dte',
            'CunaCup_Becher1',
            'CunaCup_Becher2',
            'DTOrchestrator',
        ]);
    });

    it('gets the AAS with the specified idShort', async function () {
        jest.spyOn(http, 'request').mockImplementation((options, callback) => {
            let value: unknown;
            switch ((options as http.RequestOptions).path) {
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

            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify(value));
            stream.push(null);
            stream.statusCode = 200;
            stream.statusMessage = 'OK';
            (callback as (res: IncomingMessage) => void)(stream);

            return new http.ClientRequest('http://localhost:1234');
        });

        await expect(server.readEnvironmentAsync('CunaCup_Becher1')).resolves.toBeTruthy();
    });

    it('can open a file', async function () {
        jest.spyOn(http, 'request').mockImplementation((options, callback) => {
            const stream = new IncomingMessage(new Socket());
            stream.push(
                JSON.stringify({
                    aaslist: ['0 : ExampleMotor : [IRI] http://customer.com/aas/9175_7013_7091_9168 : '],
                }),
            );
            stream.push(null);
            stream.statusCode = 200;
            stream.statusMessage = 'OK';
            (callback as (res: IncomingMessage) => void)(stream);

            return new http.ClientRequest('http://localhost:1234');
        });

        await expect(
            server.openFileAsync(
                aasEnvironment.assetAdministrationShells[0],
                selectElement(aasEnvironment, 'Documentation', 'OperatingManual', 'DigitalFile_PDF')!,
            ),
        ).resolves.toBeTruthy();
    });

    it('reads the current value of a data element', async function () {
        jest.spyOn(http, 'request').mockImplementation((options, callback) => {
            const stream = new IncomingMessage(new Socket());
            stream.push(JSON.stringify({ value: 42 }));
            stream.push(null);
            stream.statusCode = 200;
            stream.statusMessage = 'OK';
            (callback as (res: IncomingMessage) => void)(stream);

            return new http.ClientRequest('http://localhost:1234');
        });

        await expect(server.readValueAsync('http://localhost:1234', 'xs:int')).resolves.toBe(42);
    });

    describe('resolveNodeId', function () {
        let shell: jest.Mocked<aas.AssetAdministrationShell>;

        beforeEach(function () {
            shell = createSpyObj<aas.AssetAdministrationShell>({}, { idShort: 'aas1' });
        });

        it('returns the URL to "property1"', function () {
            const smId = Buffer.from('http://localhost/test/submodel1').toString('base64');
            const nodeId = smId + '.submodel1/property1';
            expect(server.resolveNodeId(shell, nodeId)).toEqual(
                `http://localhost:1234/aas/aas1/submodels/submodel1/elements/property1/value`,
            );
        });
    });
});