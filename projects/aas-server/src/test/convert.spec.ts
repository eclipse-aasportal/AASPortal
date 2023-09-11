/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { decodeBase64Url, encodeBase64Url } from '../app/convert.js';
import { describe, it, expect } from '@jest/globals';

describe('convert', function () {
    describe('atob', function () {
        it('converts ascii to base64', function () {
            expect(encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237'))
                .toEqual('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw');
        });
    });

    describe('btoa', function () {
        it('converts base64 to ascii', function () {
            expect(decodeBase64Url('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw'))
                .toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });
    });
});