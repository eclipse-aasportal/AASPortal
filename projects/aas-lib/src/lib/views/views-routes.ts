/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from '@angular/core';
import { ViewRoute } from '../types';

/** The routes to the specific views. */
export const VIEW_ROUTES = new InjectionToken<ViewRoute[]>('ViewRoutes');
