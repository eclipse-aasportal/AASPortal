/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { decodeBase64Url, encodeBase64Url } from '../lib/utilities.js';

describe('utilities', () => {
    describe('encodeBase64Url', () => {
        it('converts ascii to base64', () => {
            expect(encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237')).toEqual(
                'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw',
            );
        });
    });

    describe('decodeBase64Url', () => {
        it('converts base64 to ascii', () => {
            expect(
                decodeBase64Url('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw'),
            ).toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });
    });
});