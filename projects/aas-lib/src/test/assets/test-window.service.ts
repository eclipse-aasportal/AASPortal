/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { WindowService } from '../../lib/window.service';

export class TestWindowService implements Partial<WindowService> {
    public open(url: string): void {}

    public confirm(message: string): boolean | undefined {
        return true;
    }
}