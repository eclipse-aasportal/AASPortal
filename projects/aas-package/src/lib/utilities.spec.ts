/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, expect, it } from 'vitest';
import { decodeBase64Url, encodeBase64Url } from './utilities.js';

describe('utilities', () => {
    describe('encodeBase64Url', () => {
        it('converts ascii to base64', () => {
            expect(encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237')).toEqual(
                'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw',
            );
        });

        it('converts ÄÖÜäöüß to Base64Url string', () => {
            const b64url = encodeBase64Url('ÄÖÜäöüß');
            expect(b64url).toEqual('w4TDlsOcw6TDtsO8w58');
        });
    });

    describe('decodeBase64Url', () => {
        it('converts base64 to ascii', () => {
            expect(
                decodeBase64Url('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw'),
            ).toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });

        it('converts Base64Url string of ÄÖÜäöüß to normal string', () => {
            const str = decodeBase64Url('w4TDlsOcw6TDtsO8w58');
            expect(str).toEqual('ÄÖÜäöüß');
        });
    });
});
