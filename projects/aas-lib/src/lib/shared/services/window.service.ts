/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from '@angular/core';

export type WindowService = Window & typeof globalThis;

export const WINDOW = new InjectionToken<WindowService>('Global window object', {
    factory: (): WindowService => window,
});
