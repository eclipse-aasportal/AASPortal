/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { MaxLengthPipe } from '../../lib/max-length.pipe';

describe('MaxLengthPipe', () => {
    it('create an instance', () => {
        const pipe = new MaxLengthPipe();
        expect(pipe).toBeTruthy();
    });

    it('does not transform if text length <= max', function () {
        const pipe = new MaxLengthPipe();
        expect(pipe.transform('0123456789', 10)).toEqual('0123456789');
    });

    it('transform if text length > max', function () {
        const pipe = new MaxLengthPipe();
        expect(pipe.transform('0123456789', 5)).toEqual('0...9');
    });
});