/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, expect, it } from 'vitest';
import { Duration } from './duration';

describe('Duration', () => {
    it('create an instance', () => {
        const pipe = new Duration();
        expect(pipe).toBeTruthy();
    });

    it('should display a duration in hh:mm:ss format', () => {
        const pipe = new Duration();
        expect(pipe.transform(3661000)).toBe('01:01:01');
    });
});
